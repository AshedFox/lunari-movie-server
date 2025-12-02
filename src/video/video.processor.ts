import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { VideoService } from './video.service';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';
import {
  JOB_DIRECT,
  JOB_FROM_VARIANTS,
  TranscodeDirectPayload,
  TranscodeFromVariantsPayload,
  VIDEO_QUEUE,
} from './video-queue.types';
import { PubSub } from 'graphql-subscriptions';
import { VideoStatusEnum } from '@/utils/enums/video-status.enum';
import { StreamingGenerationProgressDto } from './dto/streaming-generation-progress.dto';

@Processor(VIDEO_QUEUE)
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly ffmpegService: FfmpegService,
    private readonly videoService: VideoService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {
    super();
  }

  async process(job: Job) {
    const videoId = job.data.videoId;
    this.logger.log(`Processing job ${job.name} for video ${videoId}`);

    const outDir = join(
      process.cwd(),
      'assets',
      `video_${videoId}`,
      'streaming',
    );

    try {
      await mkdir(outDir, { recursive: true });
      this.notify(
        videoId,
        VideoStatusEnum.PROCESSING,
        'Starting ffmpeg processing...',
      );

      if (job.name === JOB_DIRECT) {
        const data = job.data as TranscodeDirectPayload;
        await this.ffmpegService.makeMPEGDashDirectly(
          data.url,
          outDir,
          data.videoProfiles,
          data.audioProfiles,
        );
      } else if (job.name === JOB_FROM_VARIANTS) {
        const data = job.data as TranscodeFromVariantsPayload;

        const { videoVariants, audioVariants } =
          await this.videoService.prepareStreamingData(data.videoId);

        await this.ffmpegService.makeMPEGDash(
          { ENG: videoVariants.map((v) => v.media.url) },
          audioVariants.reduce((acc, cur) => {
            (acc[cur.languageId] = acc[cur.languageId] || []).push(
              cur.media.url,
            );
            return acc;
          }, {}),
          outDir,
        );
      }

      this.notify(videoId, VideoStatusEnum.PROCESSING, 'Uploading to cloud...');

      await this.videoService.clearStreamingFiles(videoId);
      await this.videoService.uploadStreamingFiles(videoId, outDir);

      await this.videoService.update(videoId, {
        status: VideoStatusEnum.COMPLETED,
      });
      this.notify(videoId, VideoStatusEnum.COMPLETED, 'Processing finished');
    } catch (err) {
      this.logger.error(err);
      await this.videoService.update(videoId, {
        status: VideoStatusEnum.FAILED,
      });
      this.notify(videoId, VideoStatusEnum.FAILED, err.message);
      throw err;
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }

  private notify(id: number, status: VideoStatusEnum, message: string) {
    this.pubSub.publish(`streamingGenerationProgress_${id}`, {
      type: status === VideoStatusEnum.FAILED ? 'error' : 'info',
      message,
      status,
    } satisfies StreamingGenerationProgressDto);
  }
}
