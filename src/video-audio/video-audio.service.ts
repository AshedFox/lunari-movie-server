import { Injectable } from '@nestjs/common';
import { BaseService } from '@common/services';
import { VideoAudioEntity } from './entities/video-audio.entity';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { join } from 'path';
import { MediaEntity } from '../media/entities/media.entity';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { AudioProfileEnum } from '@utils/enums/audio-profile.enum';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { GenerateVideoAudiosInput } from './dto/generate-video-audios.input';
import { AudioVariantsProgressDto } from './dto/audio-variants-progress.dto';
import { mkdir, rm } from 'fs/promises';
import { VideoEntity } from 'src/video/entities/video.entity';

@Injectable()
export class VideoAudioService extends BaseService<
  VideoAudioEntity,
  DeepPartial<VideoAudioEntity>,
  DeepPartial<VideoAudioEntity>
> {
  constructor(
    @InjectRepository(VideoAudioEntity)
    videoAudioRepository: Repository<VideoAudioEntity>,
    private readonly ffmpegService: FfmpegService,
    private readonly cloudService: GoogleCloudService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super(videoAudioRepository);
  }

  generateVideoAudios = async (
    { videoId, profiles, languageId }: GenerateVideoAudiosInput,
    onEvent: (data: AudioVariantsProgressDto) => Promise<void>,
  ) => {
    const outDir = join(process.cwd(), 'assets', `video_${videoId}`);
    await mkdir(outDir, { recursive: true });

    const queryRunner = this.dataSource.createQueryRunner();

    const video = await queryRunner.manager.findOne(VideoEntity, {
      where: { id: videoId },
      relations: {
        originalMedia: true,
      },
    });

    if (!video) {
      return onEvent({
        type: 'error',
        message: 'Video not exists',
      });
    }

    if (!video.originalMedia) {
      return onEvent({
        type: 'error',
        message: 'No video source for this video',
      });
    }

    const successful: AudioProfileEnum[] = [];
    const failed: AudioProfileEnum[] = [];

    for (const audioProfile of profiles) {
      try {
        await this.makeForProfile(
          videoId,
          audioProfile,
          languageId,
          video.originalMedia.url,
          outDir,
          `${audioProfile}_audio_${languageId}`,
        );

        successful.push(audioProfile);

        onEvent({
          type: 'info',
          message: `Successfully generated audio profile ${audioProfile}`,
        });
      } catch {
        failed.push(audioProfile);

        onEvent({
          type: 'error',
          message: `Failed to generate audio profile ${audioProfile}`,
        });
      }
    }

    onEvent({
      type: 'info',
      message: `Audio variants generation finished
      Successful: ${successful}
      Failed: ${failed}`,
    });

    rm(outDir, { recursive: true });
  };

  makeForProfile = async (
    videoId: number,
    profile: AudioProfileEnum,
    languageId: string,
    inputPath: string,
    outputDir: string,
    name: string,
  ): Promise<void> => {
    const outputPath = join(outputDir, `${name}.mp4`);

    await this.ffmpegService.makeAudio(
      inputPath,
      outputPath,
      profile,
      languageId,
    );

    const uploadUrl = await this.cloudService.upload(
      outputPath,
      `videos/video_${videoId}/${name}.mp4`,
    );

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const media = await queryRunner.manager.save(MediaEntity, {
        type: MediaTypeEnum.RAW,
        url: uploadUrl,
      });

      const existing = await queryRunner.manager.findOneBy(VideoAudioEntity, {
        videoId,
        languageId,
        profile,
      });

      if (!existing) {
        await queryRunner.manager.save(VideoAudioEntity, {
          videoId,
          languageId,
          profile,
          mediaId: media.id,
        });
      } else {
        await queryRunner.manager.save(VideoAudioEntity, {
          ...existing,
          mediaId: media.id,
        });
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err);
    } finally {
      await queryRunner.release();
      rm(outputPath, { recursive: true });
    }
  };
}
