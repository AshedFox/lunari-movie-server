import { Float, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { MovieEntity } from './entities/movie.entity';
import { MediaEntity } from '../media/entities/media.entity';
import { MoviePersonEntity } from '../movie-person/entities/movie-person.entity';
import { GenreEntity } from '../genre/entities/genre.entity';
import { StudioEntity } from '../studio/entities/studio.entity';
import { MovieImageEntity } from '../movie-image/entities/movie-image.entity';
import { TrailerEntity } from '../trailer/entities/trailer.entity';
import { MovieReviewEntity } from '../movie-review/entities/movie-review.entity';
import { CountryEntity } from '../country/entities/country.entity';
import { CollectionEntity } from '../collection/entities/collection.entity';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { MovieGenreEntity } from '../movie-genre/entities/movie-genre.entity';
import { MovieCountryEntity } from '../movie-country/entities/movie-country.entity';
import { MovieStudioEntity } from '../movie-studio/entities/movie-studio.entity';
import { CollectionMovieEntity } from '../collection-movie/entities/collection-movie.entity';
import { ProductEntity } from '../product/entities/product.entity';

@Resolver(MovieEntity)
export class MovieInterfaceResolver {
  @ResolveField(() => MediaEntity, { nullable: true })
  cover(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return movie.coverId
      ? loadersFactory.createOrGetLoader(MediaEntity, 'id').load(movie.coverId)
      : undefined;
  }

  @ResolveField(() => [TrailerEntity])
  trailers(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(TrailerEntity, 'movieId', MovieEntity, 'id')
      .load({ id: movie.id });
  }

  @ResolveField(() => Int)
  trailersCount(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetCountLoader(TrailerEntity, 'movieId', 'id')
      .load(movie.id);
  }

  @ResolveField(() => [MovieReviewEntity])
  reviews(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MovieReviewEntity, 'movieId', MovieEntity, 'id')
      .load({ id: movie.id });
  }

  @ResolveField(() => Int)
  reviewsCount(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetCountLoader(MovieReviewEntity, 'movieId', 'id')
      .load(movie.id);
  }

  @ResolveField(() => [MoviePersonEntity])
  moviePersons(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MoviePersonEntity, 'movieId', MovieEntity, 'id')
      .load({ id: movie.id });
  }

  @ResolveField(() => Int)
  moviePersonsCount(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetCountLoader(MoviePersonEntity, 'movieId', 'id')
      .load(movie.id);
  }

  @ResolveField(() => [MovieImageEntity])
  movieImages(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MovieImageEntity, 'movieId', MovieEntity, 'id')
      .load({ id: movie.id });
  }

  @ResolveField(() => Int)
  movieImagesCount(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetCountLoader(MovieImageEntity, 'movieId', 'id')
      .load(movie.id);
  }

  @ResolveField(() => [GenreEntity])
  genres(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        MovieGenreEntity,
        'movieId',
        MovieEntity,
        'id',
        'genre',
        GenreEntity,
      )
      .load({ id: movie.id });
  }

  @ResolveField(() => [CountryEntity])
  countries(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        MovieCountryEntity,
        'movieId',
        MovieEntity,
        'id',
        'country',
        CountryEntity,
      )
      .load({ id: movie.id });
  }

  @ResolveField(() => [StudioEntity])
  studios(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        MovieStudioEntity,
        'movieId',
        MovieEntity,
        'id',
        'studio',
        StudioEntity,
      )
      .load({ id: movie.id });
  }

  @ResolveField(() => Float)
  async rating(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    if (!movie.reviews) {
      movie.reviews = await this.reviews(movie, loadersFactory);
    }
    return movie.reviews.length > 0
      ? movie.reviews.reduce((totalMark, review) => {
          return totalMark + review.mark;
        }, 0) / movie.reviews.length
      : 0;
  }

  @ResolveField(() => [CollectionEntity])
  collections(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        CollectionMovieEntity,
        'movieId',
        MovieEntity,
        'id',
        'collection',
        CollectionEntity,
      )
      .load({ id: movie.id });
  }

  @ResolveField(() => ProductEntity, { nullable: true })
  product(
    @Parent() movie: MovieEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return movie.productId
      ? loadersFactory
          .createOrGetLoader(ProductEntity, 'id')
          .load(movie.productId)
      : undefined;
  }
}
