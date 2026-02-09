import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MovieEntity } from './entities/movie.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepository: jest.Mocked<Partial<Repository<MovieEntity>>>;
  let queryBuilder: jest.Mocked<Partial<SelectQueryBuilder<MovieEntity>>>;

  const mockMovies: Partial<MovieEntity>[] = [
    { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Movie 1' },
    { id: '550e8400-e29b-41d4-a716-446655440002', title: 'Movie 2' },
    { id: '550e8400-e29b-41d4-a716-446655440003', title: 'Movie 3' },
  ];

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockMovies),
    };

    movieRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      exists: jest.fn(),
      findBy: jest.fn(),
      remove: jest.fn(),
      metadata: { name: 'MovieEntity' } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        { provide: getRepositoryToken(MovieEntity), useValue: movieRepository },
      ],
    }).compile();

    movieService = module.get<MovieService>(MovieService);
  });

  describe('readManyRandom', () => {
    it('should return random movies with pagination', async () => {
      const result = await movieService.readManyRandom({
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(mockMovies);
      expect(movieRepository.createQueryBuilder).toHaveBeenCalledWith('m');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('random()');
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(queryBuilder.getMany).toHaveBeenCalled();
    });

    it('should respect the limit parameter', async () => {
      await movieService.readManyRandom({ limit: 5, offset: 0 });

      expect(queryBuilder.limit).toHaveBeenCalledWith(5);
    });
  });
});
