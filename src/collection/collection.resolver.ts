import {
  Args,
  Float,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CollectionService } from './collection.service';
import { CollectionEntity } from './entities/collection.entity';
import { CreateCollectionInput } from './dto/create-collection.input';
import { UpdateCollectionInput } from './dto/update-collection.input';
import { MediaEntity } from '../media/entities/media.entity';
import { PaginatedCollections } from './dto/paginated-collections';
import { MovieEntity } from '../movie/entities/movie.entity';
import { GetCollectionsArgs } from './dto/get-collections.args';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@utils/enums';
import { CurrentUserDto } from '../user/dto/current-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CollectionMovieEntity } from '../collection-movie/entities/collection-movie.entity';
import { GetMoviesRelayArgs } from '../movie/dto/get-movies.args';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { CollectionReviewEntity } from '../collection-review/entities/collection-review.entity';
import { UserEntity } from '../user/entities/user.entity';

@Resolver(() => CollectionEntity)
export class CollectionResolver {
  constructor(private readonly collectionService: CollectionService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CollectionEntity)
  createCollection(
    @Args('input') input: CreateCollectionInput,
    @CurrentUser() user: CurrentUserDto,
  ) {
    if (user.role === RoleEnum.User) {
      input = {
        ...input,
        isSystem: false,
      };
    }

    return this.collectionService.create({ ...input, ownerId: user.id });
  }

  @Query(() => PaginatedCollections)
  async getCollections(
    @Args() { sort, filter, ...pagination }: GetCollectionsArgs,
  ) {
    const [data, count] = await Promise.all([
      this.collectionService.readMany(pagination, sort, filter),
      this.collectionService.count(filter),
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

  @Query(() => CollectionEntity)
  getCollection(@Args('id', { type: () => Int }) id: number) {
    return this.collectionService.readOne(id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CollectionEntity)
  updateCollection(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCollectionInput,
    @CurrentUser() user: CurrentUserDto,
  ) {
    if (user.role === RoleEnum.User) {
      input = {
        ...input,
        isSystem: false,
      };
    }
    return this.collectionService.update(id, input);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => CollectionEntity)
  deleteCollection(@Args('id', { type: () => Int }) id: number) {
    return this.collectionService.delete(id);
  }

  @ResolveField(() => MediaEntity, { nullable: true })
  cover(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return collection.coverId
      ? loadersFactory
          .createOrGetLoader(MediaEntity, 'id')
          .load(collection.coverId)
      : undefined;
  }

  @ResolveField(() => UserEntity)
  owner(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(UserEntity, 'id')
      .load(collection.ownerId);
  }

  @ResolveField(() => [MovieEntity])
  movies(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
    @Args() { sort, filter, ...pagination }: GetMoviesRelayArgs,
  ) {
    return loadersFactory
      .createOrGetLoader(
        CollectionMovieEntity,
        'collectionId',
        CollectionEntity,
        'id',
        'movie',
        MovieEntity,
      )
      .load({
        id: collection.id,
        args: {
          sort,
          filter,
        },
        pagination,
      });
  }

  @ResolveField(() => Int)
  moviesCount(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetCountLoader(CollectionMovieEntity, 'collectionId', 'movieId')
      .load(collection.id);
  }

  @ResolveField(() => [CollectionReviewEntity])
  reviews(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        CollectionReviewEntity,
        'collectionId',
        CollectionEntity,
        'id',
      )
      .load({ id: collection.id });
  }

  @ResolveField(() => Int)
  reviewsCount(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetCountLoader(CollectionReviewEntity, 'collectionId', 'id')
      .load(collection.id);
  }

  @ResolveField(() => Float)
  async rating(
    @Parent() collection: CollectionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    if (!collection.reviews) {
      collection.reviews = await this.reviews(collection, loadersFactory);
    }
    return collection.reviews.length > 0
      ? collection.reviews.reduce((totalMark, review) => {
          return totalMark + review.mark;
        }, 0) / collection.reviews.length
      : 0;
  }
}
