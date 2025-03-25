import { Injectable } from '@nestjs/common';
import { CreateMovieUserInput } from './dto/create-movie-user.input';
import { UpdateMovieUserInput } from './dto/update-movie-user.input';
import { MovieUserEntity } from './entities/movie-user.entity';
import { Repository } from 'typeorm';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieService } from '../movie/movie.service';
import { UserService } from '../user/user.service';
import { OffsetPaginationArgsType } from '@common/pagination/offset';
import { FilterType } from '@common/filter';
import { SortType } from '@common/sort';
import { getCount, getMany } from '@common/typeorm-query-parser';

@Injectable()
export class MovieUserService {
  constructor(
    @InjectRepository(MovieUserEntity)
    private readonly movieUserRepository: Repository<MovieUserEntity>,
    private readonly movieService: MovieService,
    private readonly userService: UserService,
  ) {}

  count = async (filter?: FilterType<MovieUserEntity>): Promise<number> => {
    return getCount(this.movieUserRepository, filter);
  };

  create = async (
    createMovieUserInput: CreateMovieUserInput & { userId: string },
  ) => {
    const { userId, movieId } = createMovieUserInput;
    await this.movieService.readOne(movieId);
    await this.userService.readOneById(userId);
    const movieUser = await this.movieUserRepository.findOneBy({
      movieId,
      userId,
    });
    if (movieUser) {
      throw new AlreadyExistsError(
        `Movie user with movieId "${movieId}" and userId "${userId}" already exists!`,
      );
    }
    return this.movieUserRepository.save(createMovieUserInput);
  };

  readMany = async (
    pagination?: OffsetPaginationArgsType,
    sort?: SortType<MovieUserEntity>,
    filter?: FilterType<MovieUserEntity>,
  ): Promise<MovieUserEntity[]> => {
    return getMany(this.movieUserRepository, pagination, sort, filter);
  };

  readOne = async (
    movieId: string,
    userId: string,
  ): Promise<MovieUserEntity> => {
    const movieUser = await this.movieUserRepository.findOneBy({
      movieId,
      userId,
    });
    if (!movieUser) {
      throw new NotFoundError(
        `Movie user with movieId "${movieId}" and userId "${userId}" not found!`,
      );
    }
    return movieUser;
  };

  update = async (
    movieId: string,
    userId: string,
    updateMovieUserInput: UpdateMovieUserInput,
  ): Promise<MovieUserEntity> => {
    const movieUser = await this.movieUserRepository.findOneBy({
      movieId,
      userId,
    });
    if (!movieUser) {
      throw new NotFoundError(
        `Movie user with movieId "${movieId}" and userId "${userId}" not found!`,
      );
    }
    return this.movieUserRepository.save({
      ...movieUser,
      ...updateMovieUserInput,
    });
  };

  delete = async (
    movieId: string,
    userId: string,
  ): Promise<MovieUserEntity> => {
    const movieUser = await this.movieUserRepository.findOneBy({
      movieId,
      userId,
    });
    if (!movieUser) {
      throw new NotFoundError(
        `Movie user with movieId "${movieId}" and userId "${userId}" not found!`,
      );
    }
    return this.movieUserRepository.remove(movieUser);
  };
}
