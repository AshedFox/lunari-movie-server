import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { RoomService } from '../room/room.service';
import { OffsetPaginationArgsType } from '@common/pagination/offset';
import { SortType } from '@common/sort';
import { FilterType } from '@common/filter';
import { getCount, getMany } from '@common/typeorm-query-parser';
import { RoomMovieEntity } from './entities/room-movie.entity';
import { MovieService } from '../movie/movie.service';
import { CreateRoomMovieInput } from './dto/create-room-movie.input';
import { MoveRoomMovieInput } from './dto/move-room-movie.input';
import { WrapperType } from '@utils/types';

@Injectable()
export class RoomMovieService {
  constructor(
    @InjectRepository(RoomMovieEntity)
    private readonly roomMovieRepository: Repository<RoomMovieEntity>,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: WrapperType<RoomService>,
    private readonly movieService: MovieService,
  ) {}

  start = async (roomId: string): Promise<RoomMovieEntity> => {
    const roomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      order: 1,
    });
    if (!roomMovie) {
      throw new NotFoundError(`Room movie for room "${roomId}" not found!`);
    }

    return this.roomMovieRepository.save({
      ...roomMovie,
      showStart: new Date(),
    });
  };

  getCurrentPlayback = async (roomId: string): Promise<number> => {
    const roomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      order: 1,
      showStart: Not(IsNull()),
    });
    if (!roomMovie) {
      throw new NotFoundError(`No playing movie in room "${roomId}"!`);
    }

    return Date.now() - roomMovie.showStart.valueOf();
  };

  end = async (roomId: string): Promise<RoomMovieEntity> => {
    const roomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      order: 1,
      showStart: Not(IsNull()),
    });
    if (!roomMovie) {
      throw new NotFoundError(`No playing movie in room "${roomId}"!`);
    }

    return this.delete(roomId, roomMovie.movieId);
  };

  getCurrent = (roomId: string): Promise<RoomMovieEntity | null> => {
    return this.roomMovieRepository.findOneBy({
      roomId,
      order: 1,
      showStart: Not(IsNull()),
    });
  };

  count = async (filter?: FilterType<RoomMovieEntity>): Promise<number> => {
    return getCount(this.roomMovieRepository, filter);
  };

  create = async (input: CreateRoomMovieInput) => {
    const { roomId, movieId } = input;

    await this.roomService.readOne(roomId);
    await this.movieService.readOne(movieId);

    const roomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      movieId,
    });
    if (roomMovie) {
      throw new AlreadyExistsError(
        `Room movie with roomId "${roomId}" and movieId "${movieId}" already exists!`,
      );
    }

    const lastRoomMovieOrder = await this.roomMovieRepository.maximum('order', {
      roomId,
    });

    return this.roomMovieRepository.save({
      ...input,
      order: (lastRoomMovieOrder ?? 0) + 1,
    });
  };

  readMany = async (
    pagination?: OffsetPaginationArgsType,
    sort?: SortType<RoomMovieEntity>,
    filter?: FilterType<RoomMovieEntity>,
  ): Promise<RoomMovieEntity[]> => {
    return getMany(this.roomMovieRepository, pagination, sort, filter);
  };

  readOne = async (
    roomId: string,
    movieId: string,
  ): Promise<RoomMovieEntity> => {
    const roomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      movieId,
    });
    if (!roomMovie) {
      throw new NotFoundError(
        `Room movie with roomId "${roomId}" and movieId "${movieId}" not found!`,
      );
    }
    return roomMovie;
  };

  move = async (
    roomId: string,
    input: MoveRoomMovieInput,
  ): Promise<RoomMovieEntity> => {
    const { oldOrder, newOrder } = input;

    if (oldOrder === newOrder) {
      throw new Error('Old and new order are equal');
    }

    const oldOrderRoomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      order: oldOrder,
    });
    if (!oldOrderRoomMovie) {
      throw new NotFoundError(
        `Room movie with roomId "${roomId}" and order "${oldOrder}" not found!`,
      );
    }

    const newOrderRoomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      order: newOrder,
    });
    if (!newOrderRoomMovie) {
      throw new NotFoundError(
        `Room movie with roomId "${roomId}" and order "${newOrder}" not found!`,
      );
    }

    const result = await this.roomMovieRepository.save({
      ...oldOrderRoomMovie,
      order: newOrder,
    });

    if (newOrder > oldOrder) {
      await this.roomMovieRepository.decrement(
        {
          roomId,
          order: And(MoreThan(oldOrder), LessThanOrEqual(newOrder)),
        },
        'order',
        1,
      );
    } else {
      await this.roomMovieRepository.increment(
        {
          roomId,
          order: And(MoreThanOrEqual(newOrder), LessThan(oldOrder)),
        },
        'order',
        1,
      );
    }

    return result;
  };

  delete = async (
    roomId: string,
    movieId: string,
  ): Promise<RoomMovieEntity> => {
    const roomMovie = await this.roomMovieRepository.findOneBy({
      roomId,
      movieId,
    });
    if (!roomMovie) {
      throw new NotFoundError(
        `Room movie with roomId "${roomId}" and movieId "${movieId}" not found!`,
      );
    }
    const removed = await this.roomMovieRepository.remove(roomMovie);

    await this.roomMovieRepository.decrement(
      {
        roomId,
        order: MoreThan(removed.order),
      },
      'order',
      1,
    );

    return {
      ...removed,
      roomId,
      movieId,
    };
  };
}
