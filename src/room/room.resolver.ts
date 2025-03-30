import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { RoomService } from './room.service';
import { CreateRoomInput } from './dto/create-room.input';
import { UpdateRoomInput } from './dto/update-room.input';
import { RoomEntity } from './entities/room.entity';
import { PaginatedRooms } from './dto/paginated-rooms';
import { GetRoomsArgs } from './dto/get-rooms.args';
import {
  ForbiddenException,
  Inject,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UserEntity } from '../user/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUserDto } from '../user/dto/current-user.dto';
import { ActionEnum } from '@utils/enums/action.enum';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { RoomParticipantEntity } from '../room-participant/entities/room-participant.entity';
import { RoomMovieEntity } from '../room-movie/entities/room-movie.entity';
import { PubSub } from 'graphql-subscriptions';
import { SortDirectionEnum } from '@common/sort';

@Resolver(() => RoomEntity)
export class RoomResolver {
  constructor(
    private readonly roomService: RoomService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    @Inject('PUB_SUB')
    private readonly pubSub: PubSub,
  ) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  async startRoomPlayback(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id', ParseUUIDPipe) id: string,
  ) {
    const room = await this.roomService.readOne(id);
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.MANAGE, room)) {
      throw new ForbiddenException("You don't have access to manage room!");
    }

    const roomVideo = await this.roomService.startPlayback(id);
    await this.pubSub.publish(`roomPlaybackStarted_${id}`, roomVideo);
    return true;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  async endRoomPlayback(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id', ParseUUIDPipe) id: string,
  ) {
    const room = await this.roomService.readOne(id);
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.MANAGE, room)) {
      throw new ForbiddenException("You don't have access to manage room!");
    }

    const roomVideo = await this.roomService.endPlayback(id);
    await this.pubSub.publish(`roomPlaybackEnded_${id}`, roomVideo);
    return true;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => String)
  async generateRoomInvite(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id', ParseUUIDPipe) id: string,
  ) {
    const room = await this.roomService.readOne(id);
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.MANAGE, room)) {
      throw new ForbiddenException("You don't have access to manage room!");
    }

    return this.roomService.makeInviteToken(id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => RoomEntity)
  joinRoom(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('inviteToken') inviteToken: string,
  ) {
    return this.roomService.joinWithInvite(inviteToken, currentUser.id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => RoomEntity)
  leaveRoom(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id') id: string,
  ) {
    return this.roomService.leaveRoom(id, currentUser.id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Int)
  getRoomCurrentPlayback(@Args('id', ParseUUIDPipe) id: string) {
    return this.roomService.getCurrentPlayback(id);
  }

  @Mutation(() => RoomEntity)
  @UseGuards(GqlJwtAuthGuard)
  createRoom(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('input') createRoomInput: CreateRoomInput,
  ) {
    createRoomInput.ownerId = currentUser.id;
    return this.roomService.create(createRoomInput);
  }

  @Query(() => PaginatedRooms)
  @UseGuards(GqlJwtAuthGuard)
  async getRooms(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args() { sort, filter, ...pagination }: GetRoomsArgs,
  ) {
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.READ, RoomEntity)) {
      filter = {
        ...filter,
        or: [
          ...filter.or,
          {
            ownerId: {
              eq: currentUser.id,
            },
          },
          {
            participantsConnection: {
              userId: {
                eq: currentUser.id,
              },
            },
          },
        ],
      };
    }

    const [data, count] = await Promise.all([
      this.roomService.readMany(pagination, sort, filter),
      this.roomService.count(filter),
    ]);

    const { limit, offset } = pagination;

    return {
      nodes: data,
      pageInfo: {
        totalCount: count,
        hasNextPage: count > limit + offset,
        hasPreviousPage: offset > 0,
      },
    };
  }

  @Query(() => RoomEntity)
  @UseGuards(GqlJwtAuthGuard)
  async getRoom(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id', ParseUUIDPipe) id: string,
  ) {
    const room = await this.roomService.readOne(id);

    if (
      !(await this.roomService.hasParticipant(id, currentUser.id)) &&
      room.ownerId !== currentUser.id
    ) {
      throw new ForbiddenException("You don't have access to this room!");
    }

    return room;
  }

  @Mutation(() => RoomEntity)
  @UseGuards(GqlJwtAuthGuard)
  async updateRoom(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id', ParseUUIDPipe) id: string,
    @Args('input') updateRoomInput: UpdateRoomInput,
  ) {
    const room = await this.roomService.readOne(id);
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.UPDATE, room)) {
      throw new ForbiddenException();
    }

    return this.roomService.update(id, updateRoomInput);
  }

  @Mutation(() => RoomEntity)
  @UseGuards(GqlJwtAuthGuard)
  async deleteRoom(
    @CurrentUser() currentUser: CurrentUserDto,
    @Args('id', ParseUUIDPipe) id: string,
  ) {
    const room = await this.roomService.readOne(id);
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.DELETE, room)) {
      throw new ForbiddenException();
    }

    const deleted = await this.roomService.delete(id);
    await this.pubSub.publish(`roomDeleted_${deleted.id}`, deleted);
    return deleted;
  }

  @Subscription(() => RoomMovieEntity, {
    resolve: (value) => value,
  })
  roomPlaybackStarted(@Args('id', ParseUUIDPipe) id: string) {
    return this.pubSub.asyncIterableIterator<string>(
      `roomPlaybackStarted_${id}`,
    );
  }

  @Subscription(() => RoomMovieEntity, {
    resolve: (value) => value,
  })
  roomPlaybackEnded(@Args('id', ParseUUIDPipe) id: string) {
    return this.pubSub.asyncIterableIterator<string>(`roomPlaybackEnded_${id}`);
  }

  @Subscription(() => RoomEntity, {
    resolve: (value) => value,
  })
  roomDeleted(@Args('id', ParseUUIDPipe) id: string) {
    return this.pubSub.asyncIterableIterator<string>(`roomDeleted_${id}`);
  }

  @ResolveField(() => [UserEntity])
  participants(
    @Parent() room: RoomEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        RoomParticipantEntity,
        'roomId',
        RoomEntity,
        'id',
        'user',
        UserEntity,
      )
      .load({ id: room.id });
  }

  @ResolveField(() => RoomMovieEntity, { nullable: true })
  movies(
    @Parent() room: RoomEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(RoomMovieEntity, 'roomId', RoomEntity, 'id')
      .load({
        id: room.id,
        args: {
          sort: {
            order: {
              direction: SortDirectionEnum.ASC,
            },
          },
        },
      });
  }

  @ResolveField(() => RoomMovieEntity)
  currentMovie(@Parent() room: RoomEntity) {
    return this.roomService.getCurrentVideo(room.id);
  }

  @ResolveField(() => UserEntity)
  owner(
    @Parent() room: RoomEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return room.ownerId
      ? loadersFactory.createOrGetLoader(UserEntity, 'id').load(room.ownerId)
      : null;
  }
}
