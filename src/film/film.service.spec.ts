import { Test, TestingModule } from '@nestjs/testing';
import { FilmService } from './film.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { FilmEntity } from './entities/film.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { MovieTypeEnum } from '@utils/enums';

describe('FilmService', () => {
  let filmService: FilmService;
  let filmRepository: jest.Mocked<Partial<Repository<FilmEntity>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let queryRunner: jest.Mocked<Partial<QueryRunner>>;
  let manager: any;

  const mockFilm: Partial<FilmEntity> = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Film',
    type: MovieTypeEnum.Film,
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

    filmRepository = {
      save: jest.fn(),
      metadata: { name: 'FilmEntity' } as any,
      createQueryBuilder: jest.fn().mockReturnValue({
        whereInIds: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilmService,
        { provide: getRepositoryToken(FilmEntity), useValue: filmRepository },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    filmService = module.get<FilmService>(FilmService);
  });

  describe('create', () => {
    it('should create film with genres, studios and countries', async () => {
      const filmWithRelations = {
        ...mockFilm,
        countriesConnection: [{ movieId: 1, countryId: 'US' }],
        genresConnection: [{ movieId: 1, genreId: 1 }],
        studiosConnection: [{ movieId: 1, studioId: 1 }],
      };

      manager.save
        .mockResolvedValueOnce(mockFilm) // FilmEntity
        .mockResolvedValueOnce(filmWithRelations.countriesConnection) // MovieCountryEntity
        .mockResolvedValueOnce(filmWithRelations.genresConnection) // MovieGenreEntity
        .mockResolvedValueOnce(filmWithRelations.studiosConnection); // MovieStudioEntity

      const result = await filmService.create({
        title: 'Test Film',
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

      await filmService.create({ title: 'Test Film' } as any);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should create film without optional relations', async () => {
      manager.save.mockResolvedValueOnce(mockFilm);

      const result = await filmService.create({ title: 'Test Film' } as any);

      expect(result).toBeDefined();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });
  });
});
