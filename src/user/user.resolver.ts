import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import { UpdateUserInput } from './dto/update-user.input';
import { UserEntity } from './entities/user.entity';
import { PaginatedUsers } from './dto/paginated-users';
import { GetUsersArgs } from './dto/get-users.args';
import { ForbiddenException, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from './dto/current-user.dto';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CountryEntity } from '../country/entities/country.entity';
import { MediaEntity } from '../media/entities/media.entity';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { ActionEnum } from '@utils/enums/action.enum';
import { plainToClass } from 'class-transformer';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { MediaService } from '../media/media.service';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { SubscriptionEntity } from '../subscription/entities/subscription.entity';
import { PurchaseEntity } from '../purchase/entities/purchase.entity';
import sharp from 'sharp';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { MediaTypeEnum } from '../utils';

@Resolver(UserEntity)
export class UserResolver {
  constructor(
    private readonly mediaService: MediaService,
    private readonly userService: UserService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly cloudService: GoogleCloudService,
  ) {}

  @Query(() => UserEntity)
  @UseGuards(GqlJwtAuthGuard)
  getMe(@CurrentUser() currentUser: CurrentUserDto) {
    return this.userService.readOneById(currentUser.id);
  }

  @Query(() => PaginatedUsers)
  getUsers(@Args() { sort, filter, ...pagination }: GetUsersArgs) {
    return this.userService.readMany(pagination, sort, filter);
  }

  @Query(() => UserEntity)
  getUser(@Args('id', ParseUUIDPipe) id: string) {
    return this.userService.readOneById(id);
  }

  @Mutation(() => UserEntity)
  @UseGuards(GqlJwtAuthGuard)
  updateUser(
    @Args('id') id: string,
    @Args('input') updateUserInput: UpdateUserInput,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.UPDATE, plainToClass(UserEntity, { id }))) {
      throw new ForbiddenException();
    }

    return this.userService.update(id, updateUserInput);
  }

  @Mutation(() => UserEntity)
  @UseGuards(GqlJwtAuthGuard)
  updateMe(
    @Args('input') updateUserInput: UpdateUserInput,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.userService.update(currentUser.id, updateUserInput);
  }

  @Mutation(() => UserEntity)
  @UseGuards(GqlJwtAuthGuard)
  async updateAvatar(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    const user = await this.userService.readOneById(currentUser.id);
    const path = `images/users/${user.id}`;

    const media = await this.mediaService.createEmpty(
      { type: MediaTypeEnum.IMAGE },
      path,
      file.mimetype,
    );

    await this.cloudService.uploadStream(
      file.createReadStream().pipe(sharp().resize(640, 640).webp()),
      `${path}/${media.id}`,
      true,
      file.mimetype,
    );

    if (user.avatarId) {
      await this.mediaService.delete(user.avatarId);
      await this.cloudService.delete(`${path}/${user.avatarId}`);
    }

    return this.userService.update(user.id, {
      avatarId: media.id,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => UserEntity)
  deleteUser(
    @Args('id') id: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    const ability = this.caslAbilityFactory.createForUser(currentUser);

    if (ability.cannot(ActionEnum.DELETE, plainToClass(UserEntity, { id }))) {
      throw new ForbiddenException();
    }

    return this.userService.delete(id);
  }

  @ResolveField(() => CountryEntity)
  country(
    @Parent() parent: UserEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return parent.countryId
      ? loadersFactory
          .createOrGetLoader(CountryEntity, 'id')
          .load(parent.countryId)
      : undefined;
  }

  @ResolveField(() => MediaEntity)
  avatar(
    @Parent() parent: UserEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return parent.avatarId
      ? loadersFactory
          .createOrGetLoader(MediaEntity, 'id')
          .load(parent.avatarId)
      : undefined;
  }

  @ResolveField(() => [SubscriptionEntity])
  subscriptions(
    @Parent() parent: UserEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(SubscriptionEntity, 'userId', UserEntity, 'id')
      .load({ id: parent.id });
  }

  @ResolveField(() => [PurchaseEntity])
  purchases(
    @Parent() parent: UserEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(PurchaseEntity, 'userId', UserEntity, 'id')
      .load({ id: parent.id });
  }
}
