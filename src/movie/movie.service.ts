import { Injectable } from '@nestjs/common';
import { MovieEntity } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OffsetPaginationArgsType } from '@common/pagination/offset';
import { BaseService } from '@common/services';
import { CreateMovieInput } from './dto/create-movie.input';
import { UpdateMovieInput } from './dto/update-movie.input';

@Injectable()
export class MovieService extends BaseService<
  MovieEntity,
  CreateMovieInput,
  UpdateMovieInput
> {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
  ) {
    super(movieRepository);
  }

  readManyRandom = async (
    pagination?: OffsetPaginationArgsType,
  ): Promise<MovieEntity[]> => {
    return this.movieRepository
      .createQueryBuilder('m')
      .select()
      .orderBy('random()')
      .limit(pagination.limit)
      .getMany();
  };
}
