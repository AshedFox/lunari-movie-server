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
import { mkdir, readdir, rm } from 'fs/promises';
import { StreamingGenerationProgressDto } from './dto/streaming-generation-progress.dto';
import { CreateStreamingDirectlyInput } from './dto/create-streaming-directly.input';

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
  ) {
    super(videoRepository);
  }

  createStreamingDirectly = async (
    { id, url, videoProfiles, audioProfiles }: CreateStreamingDirectlyInput,
    onEvent: (data: StreamingGenerationProgressDto) => Promise<void>,
  ) => {
    const outDir = join(process.cwd(), 'assets', `video_${id}`, 'streaming');

    const video = await this.videoRepository.findOneBy({ id });

    if (!video) {
      return onEvent({
        type: 'error',
        message: `Video not exists`,
      });
    }

    try {
      onEvent({
        type: 'info',
        message: `Starting creation`,
      });
      await mkdir(outDir, { recursive: true });

      await this.ffmpegService.makeMPEGDashDirectly(
        url,
        outDir,
        videoProfiles,
        audioProfiles,
      );

      await onEvent({
        type: 'info',
        message: `Successfully generated streaming`,
      });

      await onEvent({
        type: 'info',
        message: `Clearing previous streaming files and media`,
      });

      await this.clearStreamingFiles(id);

      await onEvent({
        type: 'info',
        message: `Successfully cleared previous streaming files and media`,
      });

      await onEvent({
        type: 'info',
        message: `Uploading streaming files to the cloud`,
      });

      await this.uploadStreamingFiles(id, outDir);

      await onEvent({
        type: 'info',
        message: `Successully uploaded streaming files to the cloud`,
      });

      await onEvent({
        type: 'info',
        message: `Successfully finished streaming creation`,
      });
    } catch (err) {
      onEvent({
        type: 'error',
        message: err.message,
      });
    } finally {
      rm(outDir, { recursive: true });
    }
  };

  createStreaming = async (
    id: number,
    onEvent: (data: StreamingGenerationProgressDto) => Promise<void>,
  ): Promise<void> => {
    const outDir = join(process.cwd(), 'assets', `video_${id}`, 'streaming');

    const video = await this.videoRepository.findOneBy({ id });

    if (!video) {
      return onEvent({
        type: 'error',
        message: `Video not exists`,
      });
    }

    try {
      await mkdir(outDir, { recursive: true });

      await onEvent({
        type: 'info',
        message: `Preparing data for streaming generation`,
      });

      const data = await this.prepareStreamingData(id);

      await onEvent({
        type: 'info',
        message: `Starting streaming generation`,
      });

      await this.generateStreaming(
        id,
        outDir,
        data.videoVariants,
        data.audioVariants,
      );

      await onEvent({
        type: 'info',
        message: `Successfully generated streaming`,
      });

      await onEvent({
        type: 'info',
        message: `Clearing previous streaming files and media`,
      });

      await this.clearStreamingFiles(id);

      await onEvent({
        type: 'info',
        message: `Successfully cleared previous streaming files and media`,
      });

      await onEvent({
        type: 'info',
        message: `Uploading streaming files to the cloud`,
      });

      await this.uploadStreamingFiles(id, outDir);

      await onEvent({
        type: 'info',
        message: `Successully uploaded streaming files to the cloud`,
      });

      await onEvent({
        type: 'info',
        message: `Successfully finished streaming creation`,
      });
    } catch (err) {
      await onEvent({ type: 'error', message: err.message });
    } finally {
      await rm(outDir, { recursive: true });
    }
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
