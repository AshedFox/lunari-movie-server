import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateRoomInput } from './dto/create-room.input';
import { UpdateRoomInput } from './dto/update-room.input';
import { RoomEntity } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@common/services';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RoomParticipantService } from '../room-participant/room-participant.service';
import { RoomMovieService } from '../room-movie/room-movie.service';
import { RoomMovieEntity } from '../room-movie/entities/room-movie.entity';
import { WrapperType } from '@utils/types';
import type { StringValue } from 'ms';

@Injectable()
export class RoomService extends BaseService<
  RoomEntity,
  CreateRoomInput,
  UpdateRoomInput
> {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RoomParticipantService))
    private readonly roomParticipantService: WrapperType<RoomParticipantService>,
    @Inject(forwardRef(() => RoomMovieService))
    private readonly roomMovieService: WrapperType<RoomMovieService>,
  ) {
    super(roomRepository);
  }

  hasParticipant = async (roomId: string, userId: string): Promise<boolean> => {
    try {
      await this.roomParticipantService.readOne(roomId, userId);
      return true;
    } catch {
      return false;
    }
  };

  startPlayback = (id: string): Promise<RoomMovieEntity> => {
    return this.roomMovieService.start(id);
  };

  endPlayback = (id: string): Promise<RoomMovieEntity> => {
    return this.roomMovieService.end(id);
  };

  getCurrentVideo = async (id: string): Promise<RoomMovieEntity> => {
    return this.roomMovieService.getCurrent(id);
  };

  getCurrentPlayback = (id: string): Promise<number> => {
    return this.roomMovieService.getCurrentPlayback(id);
  };

  makeInviteToken = (id: string): string => {
    return this.jwtService.sign(
      {
        sub: id,
      },
      {
        algorithm: 'HS512',
        secret: this.configService.get<string>('ROOM_INVITE_TOKEN_SECRET'),
        expiresIn: this.configService.get<StringValue>(
          'ROOM_INVITE_TOKEN_LIFETIME',
        ),
      },
    );
  };

  joinWithInvite = async (
    inviteToken: string,
    userId: string,
  ): Promise<RoomEntity> => {
    try {
      const { sub } = this.jwtService.verify<{
        sub: string;
      }>(inviteToken, {
        algorithms: ['HS512'],
        secret: this.configService.get<string>('ROOM_INVITE_TOKEN_SECRET'),
      });

      await this.roomParticipantService.create(sub, userId);
      return this.roomRepository.findOneBy({
        id: sub,
      });
    } catch (err) {
      throw new BadRequestException(err);
    }
  };

  leaveRoom = async (roomId: string, userId: string): Promise<RoomEntity> => {
    await this.roomParticipantService.delete(roomId, userId);
    return this.roomRepository.findOneBy({
      id: roomId,
    });
  };
}
