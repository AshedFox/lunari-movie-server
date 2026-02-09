import { Test, TestingModule } from '@nestjs/testing';
import { VideoAudioService } from './video-audio.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { VideoAudioEntity } from './entities/video-audio.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { AudioProfileEnum } from '@utils/enums/audio-profile.enum';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
}));

describe('VideoAudioService', () => {
  let videoAudioService: VideoAudioService;
  let videoAudioRepository: jest.Mocked<Partial<Repository<VideoAudioEntity>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let ffmpegService: jest.Mocked<Partial<FfmpegService>>;
  let cloudService: jest.Mocked<Partial<GoogleCloudService>>;
  let queryRunner: jest.Mocked<Partial<QueryRunner>>;
  let manager: any;

  const mockVideoAudio: Partial<VideoAudioEntity> = {
    id: 1,
    videoId: 1,
    profile: AudioProfileEnum.MEDIUM,
    languageId: 'en',
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

    videoAudioRepository = {
      save: jest.fn(),
      metadata: { name: 'VideoAudioEntity' } as any,
      createQueryBuilder: jest.fn().mockReturnValue({
        whereInIds: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    ffmpegService = {
      makeAudio: jest.fn().mockResolvedValue(undefined),
    };

    cloudService = {
      upload: jest
        .fn()
        .mockResolvedValue('https://storage.example.com/audio.mp4'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoAudioService,
        {
          provide: getRepositoryToken(VideoAudioEntity),
          useValue: videoAudioRepository,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: FfmpegService, useValue: ffmpegService },
        { provide: GoogleCloudService, useValue: cloudService },
      ],
    }).compile();

    videoAudioService = module.get<VideoAudioService>(VideoAudioService);
  });

  describe('generateVideoAudios', () => {
    const mockOnEvent = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      mockOnEvent.mockClear();
    });

    it('should generate audio variants successfully', async () => {
      const mockVideo = {
        id: 1,
        originalMedia: { url: 'https://example.com/source.mp4' },
      };
      manager.findOne.mockResolvedValue(mockVideo);
      manager.findOneBy.mockResolvedValue(null);
      manager.save.mockResolvedValue({ id: 'media-new' });

      await videoAudioService.generateVideoAudios(
        { videoId: 1, profiles: [AudioProfileEnum.MEDIUM], languageId: 'en' },
        mockOnEvent,
      );

      expect(mockOnEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info' }),
      );
    });

    it('should send error event when video not found', async () => {
      manager.findOne.mockResolvedValue(null);

      await videoAudioService.generateVideoAudios(
        {
          videoId: 999,
          profiles: [AudioProfileEnum.MEDIUM],
          languageId: 'en',
        },
        mockOnEvent,
      );

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: 'error',
        message: 'Video not exists',
      });
    });

    it('should send error event when no original media', async () => {
      manager.findOne.mockResolvedValue({ id: 1, originalMedia: null });

      await videoAudioService.generateVideoAudios(
        { videoId: 1, profiles: [AudioProfileEnum.MEDIUM], languageId: 'en' },
        mockOnEvent,
      );

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: 'error',
        message: 'No video source for this video',
      });
    });
  });

  describe('makeForProfile', () => {
    it('should create new audio variant when not exists', async () => {
      manager.save.mockResolvedValue({ id: 'media-123' });
      manager.findOneBy.mockResolvedValue(null);

      await videoAudioService.makeForProfile(
        1,
        AudioProfileEnum.MEDIUM,
        'en',
        'https://example.com/source.mp4',
        '/tmp/output',
        'test_audio',
      );

      expect(ffmpegService.makeAudio).toHaveBeenCalled();
      expect(cloudService.upload).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should update existing audio variant', async () => {
      manager.save.mockResolvedValue({ id: 'media-123' });
      manager.findOneBy.mockResolvedValue(mockVideoAudio);

      await videoAudioService.makeForProfile(
        1,
        AudioProfileEnum.MEDIUM,
        'en',
        'https://example.com/source.mp4',
        '/tmp/output',
        'test_audio',
      );

      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        videoAudioService.makeForProfile(
          1,
          AudioProfileEnum.MEDIUM,
          'en',
          'https://example.com/source.mp4',
          '/tmp/output',
          'test_audio',
        ),
      ).rejects.toThrow();

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
