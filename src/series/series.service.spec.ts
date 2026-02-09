import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from './series.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { SeriesEntity } from './entities/series.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { MovieTypeEnum } from '@utils/enums';

describe('SeriesService', () => {
  let seriesService: SeriesService;
  let seriesRepository: jest.Mocked<Partial<Repository<SeriesEntity>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let queryRunner: jest.Mocked<Partial<QueryRunner>>;
  let manager: any;

  const mockSeries: Partial<SeriesEntity> = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Series',
    type: MovieTypeEnum.Series,
  };

  beforeEach(async () => {
    manager = {
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

    seriesRepository = {
      save: jest.fn(),
      metadata: { name: 'SeriesEntity' } as any,
      createQueryBuilder: jest.fn().mockReturnValue({
        whereInIds: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: getRepositoryToken(SeriesEntity),
          useValue: seriesRepository,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    seriesService = module.get<SeriesService>(SeriesService);
  });

  describe('create', () => {
    it('should create series with genres, studios and countries', async () => {
      const seriesWithRelations = {
        ...mockSeries,
        countriesConnection: [{ movieId: 1, countryId: 'US' }],
        genresConnection: [{ movieId: 1, genreId: 1 }],
        studiosConnection: [{ movieId: 1, studioId: 1 }],
      };

      manager.save
        .mockResolvedValueOnce(mockSeries) // SeriesEntity
        .mockResolvedValueOnce(seriesWithRelations.countriesConnection)
        .mockResolvedValueOnce(seriesWithRelations.genresConnection)
        .mockResolvedValueOnce(seriesWithRelations.studiosConnection);

      const result = await seriesService.create({
        title: 'Test Series',
        countriesIds: ['US'],
        genresIds: [1],
        studiosIds: [1],
      } as any);

      expect(result).toBeDefined();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      manager.save.mockRejectedValue(new Error('DB Error'));

      await seriesService.create({ title: 'Test Series' } as any);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should create series without optional relations', async () => {
      manager.save.mockResolvedValueOnce(mockSeries);

      const result = await seriesService.create({
        title: 'Test Series',
      } as any);

      expect(result).toBeDefined();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });
  });
});
