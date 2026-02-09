import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { VideoEntity } from './entities/video.entity';
import { Repository, DataSource } from 'typeorm';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { MediaService } from '../media/media.service';
import { getQueueToken } from '@nestjs/bullmq';
import { VIDEO_QUEUE } from './video-queue.types';
import { VideoStatusEnum } from '@/utils/enums/video-status.enum';

describe('VideoService', () => {
  let videoService: VideoService;
  let videoRepository: jest.Mocked<Partial<Repository<VideoEntity>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let ffmpegService: jest.Mocked<Partial<FfmpegService>>;
  let cloudService: jest.Mocked<Partial<GoogleCloudService>>;
  let mediaService: jest.Mocked<Partial<MediaService>>;
  let videoQueue: any;

  const mockVideo: Partial<VideoEntity> = {
    id: 1,
    status: VideoStatusEnum.PENDING,
    dashManifestMediaId: null,
  };

  beforeEach(async () => {
    videoRepository = {
      findOneBy: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        whereInIds: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
      metadata: { name: 'VideoEntity' } as any,
    };

    const mockQueryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    dataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    ffmpegService = {
      makeMPEGDash: jest.fn().mockResolvedValue(undefined),
    };

    cloudService = {
      delete: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn().mockResolvedValue('https://storage.example.com/file'),
    };

    mediaService = {
      create: jest.fn().mockResolvedValue({ id: 'media-123' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    videoQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: getRepositoryToken(VideoEntity), useValue: videoRepository },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: FfmpegService, useValue: ffmpegService },
        { provide: GoogleCloudService, useValue: cloudService },
        { provide: MediaService, useValue: mediaService },
        { provide: getQueueToken(VIDEO_QUEUE), useValue: videoQueue },
      ],
    }).compile();

    videoService = module.get<VideoService>(VideoService);
  });

  describe('createStreamingDirectly', () => {
    it('should add job to queue and update status', async () => {
      videoRepository.findOneBy.mockResolvedValue(mockVideo as VideoEntity);
      videoRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await videoService.createStreamingDirectly({
        id: 1,
        url: 'https://example.com/video.mp4',
        videoProfiles: [],
        audioProfiles: [],
      });

      expect(result).toBe(true);
      expect(videoRepository.update).toHaveBeenCalledWith(1, {
        status: VideoStatusEnum.PROCESSING,
      });
      expect(videoQueue.add).toHaveBeenCalled();
    });

    it('should throw error when video not found', async () => {
      videoRepository.findOneBy.mockResolvedValue(null);

      await expect(
        videoService.createStreamingDirectly({
          id: 999,
          url: 'https://example.com/video.mp4',
          videoProfiles: [],
          audioProfiles: [],
        }),
      ).rejects.toThrow('Video not found!');
    });
  });

  describe('createStreamingFromVariants', () => {
    it('should add job to queue and update status', async () => {
      videoRepository.findOneBy.mockResolvedValue(mockVideo as VideoEntity);
      videoRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await videoService.createStreamingFromVariants(1);

      expect(result).toBe(true);
      expect(videoRepository.update).toHaveBeenCalledWith(1, {
        status: VideoStatusEnum.PROCESSING,
      });
      expect(videoQueue.add).toHaveBeenCalled();
    });

    it('should throw error when video not found', async () => {
      videoRepository.findOneBy.mockResolvedValue(null);

      await expect(
        videoService.createStreamingFromVariants(999),
      ).rejects.toThrow('Video not found!');
    });
  });

  describe('prepareStreamingData', () => {
    it('should return video and audio variants', async () => {
      const mockVideoVariants = [{ id: 1, media: { url: 'video.mp4' } }];
      const mockAudioVariants = [
        { id: 1, media: { url: 'audio.mp4' }, languageId: 'en' },
      ];

      const videoQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockVideoVariants),
      };

      const audioQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAudioVariants),
      };

      (dataSource.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(videoQb)
        .mockReturnValueOnce(audioQb);

      const result = await videoService.prepareStreamingData(1);

      expect(result.videoVariants).toEqual(mockVideoVariants);
      expect(result.audioVariants).toEqual(mockAudioVariants);
    });

    it('should throw error when no audio variants', async () => {
      const videoQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };

      const audioQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      (dataSource.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(videoQb)
        .mockReturnValueOnce(audioQb);

      await expect(videoService.prepareStreamingData(1)).rejects.toThrow(
        'Cannot generate streaming files for video 1, no audio variants.',
      );
    });

    it('should throw error when no video variants', async () => {
      const videoQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const audioQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };

      (dataSource.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(videoQb)
        .mockReturnValueOnce(audioQb);

      await expect(videoService.prepareStreamingData(1)).rejects.toThrow(
        'Cannot generate streaming files for video 1, no video variants.',
      );
    });
  });

  describe('clearStreamingFiles', () => {
    it('should clear streaming files and delete from cloud', async () => {
      const videoWithManifest = {
        ...mockVideo,
        dashManifestMediaId: 'manifest-123',
      };
      videoRepository.findOneBy.mockResolvedValue(
        videoWithManifest as VideoEntity,
      );
      videoRepository.save.mockResolvedValue(videoWithManifest as VideoEntity);

      await videoService.clearStreamingFiles(1);

      expect(mediaService.delete).toHaveBeenCalledWith('manifest-123');
      expect(cloudService.delete).toHaveBeenCalledWith(
        'videos/video_1/streaming',
      );
    });

    it('should throw error when video not found', async () => {
      videoRepository.findOneBy.mockResolvedValue(null);

      await expect(videoService.clearStreamingFiles(999)).rejects.toThrow(
        'Video with id 999 not found',
      );
    });
  });
});
