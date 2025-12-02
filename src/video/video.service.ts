import { Injectable } from '@nestjs/common';
import { VideoEntity } from './entities/video.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@common/services';
import { join, relative } from 'path';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';
import { VideoVariantEntity } from '../video-variant/entities/video-variant.entity';
import { VideoAudioEntity } from '../video-audio/entities/video-audio.entity';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { MediaService } from '../media/media.service';
import { readdir } from 'fs/promises';
import { CreateStreamingDirectlyInput } from './dto/create-streaming-directly.input';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  JOB_DIRECT,
  JOB_FROM_VARIANTS,
  TranscodeDirectPayload,
  TranscodeFromVariantsPayload,
  VIDEO_QUEUE,
} from './video-queue.types';
import { VideoStatusEnum } from '@/utils/enums/video-status.enum';

@Injectable()
export class VideoService extends BaseService<
  VideoEntity,
  Partial<VideoEntity>,
  Partial<VideoEntity>
> {
  constructor(
    @InjectRepository(VideoEntity)
    private readonly videoRepository: Repository<VideoEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly ffmpegService: FfmpegService,
    private readonly cloudService: GoogleCloudService,
    private readonly mediaService: MediaService,
    @InjectQueue(VIDEO_QUEUE) private videoProcessingQueue: Queue,
  ) {
    super(videoRepository);
  }

  createStreamingDirectly = async (input: CreateStreamingDirectlyInput) => {
    const video = await this.videoRepository.findOneBy({ id: input.id });

    if (!video) {
      throw new Error('Video not found!');
    }

    await this.videoRepository.update(input.id, {
      status: VideoStatusEnum.PROCESSING,
    });

    await this.videoProcessingQueue.add(JOB_DIRECT, {
      videoId: input.id,
      url: input.url,
      videoProfiles: input.videoProfiles,
      audioProfiles: input.audioProfiles,
    } satisfies TranscodeDirectPayload);

    return true;
  };

  createStreamingFromVariants = async (videoId: number) => {
    const video = await this.videoRepository.findOneBy({ id: videoId });

    if (!video) {
      throw new Error('Video not found!');
    }

    await this.videoRepository.update(videoId, {
      status: VideoStatusEnum.PROCESSING,
    });

    await this.videoProcessingQueue.add(JOB_FROM_VARIANTS, {
      videoId,
    } satisfies TranscodeFromVariantsPayload);

    return true;
  };

  prepareStreamingData = async (
    id: number,
  ): Promise<{
    videoVariants: VideoVariantEntity[];
    audioVariants: VideoAudioEntity[];
  }> => {
    const videoVariants = await this.dataSource
      .createQueryBuilder(VideoVariantEntity, 'vv')
      .innerJoinAndSelect('vv.media', 'm', 'm.id = vv.media_id')
      .where('video_id = :id', { id })
      .getMany();
    const audioVariants = await this.dataSource
      .createQueryBuilder(VideoAudioEntity, 'av')
      .innerJoinAndSelect('av.media', 'm', 'm.id = av.media_id')
      .where('video_id = :id', { id })
      .getMany();

    if (audioVariants.length === 0) {
      throw new Error(
        `Cannot generate streaming files for video ${id}, no audio variants.`,
      );
    } else if (videoVariants.length === 0) {
      throw new Error(
        `Cannot generate streaming files for video ${id}, no video variants.`,
      );
    }

    return {
      videoVariants,
      audioVariants,
    };
  };

  generateStreaming = async (
    id: number,
    streamingOutDir: string,
    videoVariants: VideoVariantEntity[],
    audioVariants: VideoAudioEntity[],
  ) => {
    try {
      await this.ffmpegService.makeMPEGDash(
        {
          ENG: videoVariants.map((value) => value.media.url),
        },
        audioVariants.reduce((prev, curr) => {
          if (!prev[curr.languageId]) {
            prev[curr.languageId] = [];
          }
          prev[curr.languageId].push(curr.media.url);
          return prev;
        }, {}),
        streamingOutDir,
      );
    } catch {
      throw new Error(`Failed to generate streaming for video ${id}`);
    }
  };

  clearStreamingFiles = async (id: number) => {
    const video = await this.videoRepository.findOneBy({
      id,
    });

    if (!video) {
      throw new Error(`Video with id ${id} not found`);
    }

    if (video.dashManifestMediaId) {
      await this.videoRepository.save({
        ...video,
        dashManifestMediaId: null,
        hlsManifestMediaId: null,
      });

      await this.mediaService.delete(video.dashManifestMediaId);
    }

    await this.cloudService.delete(`videos/video_${id}/streaming`);
  };

  uploadStreamingFiles = async (id: number, streamingOutDir: string) => {
    try {
      const files = await readdir(streamingOutDir, {
        withFileTypes: true,
        recursive: true,
      });

      for (const file of files) {
        if (!file.isFile()) {
          continue;
        }

        const filePath = relative(
          streamingOutDir,
          join(file.parentPath, file.name),
        );

        const uploadUrl = await this.cloudService.upload(
          join(streamingOutDir, filePath),
          `videos/video_${id}/streaming/${filePath.replace('\\', '/')}`,
          true,
        );

        if (filePath === 'master.mpd') {
          const manifestMedia = await this.mediaService.create({
            type: MediaTypeEnum.VIDEO,
            url: uploadUrl,
          });

          await this.update(id, {
            dashManifestMediaId: manifestMedia.id,
          });
        }
      }
    } catch {
      throw new Error(`Failed to upload files for video ${id}`);
    }
  };
}
