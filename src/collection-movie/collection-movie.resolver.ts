import {
  Args,
  Int,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CollectionMovieEntity } from './entities/collection-movie.entity';
import { CollectionMovieService } from './collection-movie.service';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { MovieEntity } from '../movie/entities/movie.entity';
import { CollectionEntity } from '../collection/entities/collection.entity';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';

@Resolver(() => CollectionMovieEntity)
export class CollectionMovieResolver {
  constructor(
    private readonly collectionMovieService: CollectionMovieService,
  ) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CollectionMovieEntity)
  createCollectionMovie(
    @Args('collectionId', { type: () => Int }) collectionId: number,
    @Args('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.collectionMovieService.create(collectionId, movieId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CollectionMovieEntity)
  deleteCollectionMovie(
    @Args('collectionId', { type: () => Int }) collectionId: number,
    @Args('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.collectionMovieService.delete(collectionId, movieId);
  }

  @ResolveField(() => MovieEntity)
  movie(
    @Parent() collectionMovie: CollectionMovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MovieEntity, 'id')
      .load(collectionMovie.movieId);
  }

  @ResolveField(() => CollectionEntity)
  collection(
    @Parent() collectionMovie: CollectionMovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(CollectionEntity, 'id')
      .load(collectionMovie.collectionId);
  }
}
