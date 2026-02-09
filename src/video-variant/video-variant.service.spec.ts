import { Test, TestingModule } from '@nestjs/testing';
import { VideoVariantService } from './video-variant.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { VideoVariantEntity } from './entities/video-variant.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { VideoProfileEnum } from '@utils/enums/video-profile.enum';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
}));

describe('VideoVariantService', () => {
  let videoVariantService: VideoVariantService;
  let videoVariantRepository: jest.Mocked<
    Partial<Repository<VideoVariantEntity>>
  >;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let ffmpegService: jest.Mocked<Partial<FfmpegService>>;
  let cloudService: jest.Mocked<Partial<GoogleCloudService>>;
  let queryRunner: jest.Mocked<Partial<QueryRunner>>;
  let manager: any;

  const mockVideoVariant: Partial<VideoVariantEntity> = {
    id: 1,
    videoId: 1,
    profile: VideoProfileEnum.PROFILE_360p,
    mediaId: 'media-123',
  };

  beforeEach(async () => {
    manager = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager,
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    videoVariantRepository = {
      save: jest.fn(),
      metadata: { name: 'VideoVariantEntity' } as any,
      createQueryBuilder: jest.fn().mockReturnValue({
        whereInIds: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    ffmpegService = {
      makeVideo: jest.fn().mockResolvedValue(undefined),
    };

    cloudService = {
      upload: jest
        .fn()
        .mockResolvedValue('https://storage.example.com/video.mp4'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoVariantService,
        {
          provide: getRepositoryToken(VideoVariantEntity),
          useValue: videoVariantRepository,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: FfmpegService, useValue: ffmpegService },
        { provide: GoogleCloudService, useValue: cloudService },
      ],
    }).compile();

    videoVariantService = module.get<VideoVariantService>(VideoVariantService);
  });

  describe('generateVideoVariants', () => {
    const mockOnEvent = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      mockOnEvent.mockClear();
    });

    it('should generate video variants successfully', async () => {
      const mockVideo = {
        id: 1,
        originalMedia: { url: 'https://example.com/source.mp4' },
      };
      manager.findOne.mockResolvedValue(mockVideo);
      manager.findOneBy.mockResolvedValue(null); // No existing variant
      manager.save.mockResolvedValue({ id: 'media-new' });

      await videoVariantService.generateVideoVariants(
        { videoId: 1, profiles: [VideoProfileEnum.PROFILE_360p] },
        mockOnEvent,
      );

      expect(mockOnEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info' }),
      );
    });

    it('should send error event when video not found', async () => {
      manager.findOne.mockResolvedValue(null);

      await videoVariantService.generateVideoVariants(
        { videoId: 999, profiles: [VideoProfileEnum.PROFILE_360p] },
        mockOnEvent,
      );

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: 'error',
        message: 'Video not exists',
      });
    });

    it('should send error event when no original media', async () => {
      manager.findOne.mockResolvedValue({ id: 1, originalMedia: null });

      await videoVariantService.generateVideoVariants(
        { videoId: 1, profiles: [VideoProfileEnum.PROFILE_360p] },
        mockOnEvent,
      );

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: 'error',
        message: 'No video source for this video',
      });
    });
  });

  describe('makeForProfile', () => {
    it('should create new video variant when not exists', async () => {
      manager.save.mockResolvedValue({ id: 'media-123' });
      manager.findOneBy.mockResolvedValue(null);

      await videoVariantService.makeForProfile(
        1,
        VideoProfileEnum.PROFILE_360p,
        'https://example.com/source.mp4',
        '/tmp/output',
        'test_video',
      );

      expect(ffmpegService.makeVideo).toHaveBeenCalled();
      expect(cloudService.upload).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should update existing video variant', async () => {
      manager.save.mockResolvedValue({ id: 'media-123' });
      manager.findOneBy.mockResolvedValue(mockVideoVariant);

      await videoVariantService.makeForProfile(
        1,
        VideoProfileEnum.PROFILE_360p,
        'https://example.com/source.mp4',
        '/tmp/output',
        'test_video',
      );

      expect(manager.save).toHaveBeenCalledTimes(2); // Media + VideoVariant
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        videoVariantService.makeForProfile(
          1,
          VideoProfileEnum.PROFILE_360p,
          'https://example.com/source.mp4',
          '/tmp/output',
          'test_video',
        ),
      ).rejects.toThrow();

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
