import { Injectable } from '@nestjs/common';
import { CreateVideoVariantInput } from './dto/create-video-variant.input';
import { DataSource, Repository } from 'typeorm';
import { VideoVariantEntity } from './entities/video-variant.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@common/services';
import { UpdateVideoVariantInput } from './dto/update-video-variant.input';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { VideoProfileEnum } from '@utils/enums/video-profile.enum';
import { join } from 'path';
import { MediaEntity } from '../media/entities/media.entity';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { mkdir, rm } from 'fs/promises';
import { GenerateVideoVariantsInput } from './dto/generate-video-variants.input';
import { VideoVariantsProgressDto } from './dto/video-variants-progress.dto';
import { VideoEntity } from 'src/video/entities/video.entity';

@Injectable()
export class VideoVariantService extends BaseService<
  VideoVariantEntity,
  CreateVideoVariantInput,
  UpdateVideoVariantInput
> {
  constructor(
    @InjectRepository(VideoVariantEntity)
    videoVariantRepository: Repository<VideoVariantEntity>,
    private readonly ffmpegService: FfmpegService,
    private readonly cloudService: GoogleCloudService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super(videoVariantRepository);
  }

  generateVideoVariants = async (
    { videoId, profiles }: GenerateVideoVariantsInput,
    onEvent: (data: VideoVariantsProgressDto) => Promise<void>,
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

    const successful: VideoProfileEnum[] = [];
    const failed: VideoProfileEnum[] = [];

    for (const videoProfile of profiles) {
      try {
        await this.makeForProfile(
          videoId,
          videoProfile,
          video.originalMedia.url,
          outDir,
          `${videoProfile}_video`,
        );

        successful.push(videoProfile);

        onEvent({
          type: 'info',
          message: `Successfully generated video profile ${videoProfile}`,
        });
      } catch {
        failed.push(videoProfile);

        onEvent({
          type: 'error',
          message: `Failed to generate video profile ${videoProfile}`,
        });
      }
    }

    onEvent({
      type: 'info',
      message: `Video variants generation finished
        Successful: ${successful}
        Failed: ${failed}`,
    });

    rm(outDir, { recursive: true });
  };

  makeForProfile = async (
    videoId: number,
    profile: VideoProfileEnum,
    inputPath: string,
    outputDir: string,
    name: string,
  ): Promise<void> => {
    const outputPath = join(outputDir, `${name}.mp4`);

    await this.ffmpegService.makeVideo(inputPath, outputPath, profile);

    const uploadUrl = await this.cloudService.upload(
      outputPath,
      `videos/video_${videoId}/${name}.mp4`,
    );

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const media = await queryRunner.manager.save(MediaEntity, {
        type: MediaTypeEnum.VIDEO,
        url: uploadUrl,
      });

      const existing = await queryRunner.manager.findOneBy(VideoVariantEntity, {
        videoId,
        profile,
      });

      if (!existing) {
        await queryRunner.manager.save(VideoVariantEntity, {
          videoId,
          profile,
          mediaId: media.id,
        });
      } else {
        await queryRunner.manager.save(VideoVariantEntity, {
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
      rm(outputPath);
    }
  };
}
