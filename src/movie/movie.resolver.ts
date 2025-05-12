import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MovieEntity } from './entities/movie.entity';
import { GetMoviesOffsetArgs, GetMoviesRelayArgs } from './dto/get-movies.args';
import { MovieService } from './movie.service';
import { AccessModeEnum } from '@utils/enums/access-mode.enum';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { MediaTypeEnum, RoleEnum } from '@utils/enums';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MovieInterfaceResolver } from './movie-interface.resolver';
import {
  OffsetPaginatedMovies,
  RelayPaginatedMovies,
} from './dto/paginated-movies';
import { UpdateMovieInput } from './dto/update-movie.input';
import { GoogleCloudService } from '@/cloud/google-cloud.service';
import { MediaService } from '@/media/media.service';
import { GraphQLUpload, FileUpload } from 'graphql-upload-minimal';
import sharp from 'sharp';

@Resolver(MovieEntity)
export class MovieResolver extends MovieInterfaceResolver {
  constructor(
    private readonly movieService: MovieService,
    private readonly mediaService: MediaService,
    private readonly cloudService: GoogleCloudService,
  ) {
    super();
  }

  @Mutation(() => MovieEntity)
  @Role([RoleEnum.Admin])
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  async updateMovieCover(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
    @Args('movieId') movieId: string,
  ) {
    const movie = await this.movieService.readOne(movieId);
    const path = `images/movies/${movie.id}`;

    const media = await this.mediaService.createEmpty(
      { type: MediaTypeEnum.IMAGE },
      path,
      file.mimetype,
    );

    await this.cloudService.uploadStream(
      file.createReadStream().pipe(
        sharp()
          .resize({
            width: 1920,
            fit: 'inside',
          })
          .webp(),
      ),
      `${path}/${media.id}`,
      true,
      file.mimetype,
    );

    if (movie.coverId) {
      await this.mediaService.delete(movie.coverId);
      await this.cloudService.delete(`${path}/${movie.coverId}`);
    }

    return this.movieService.update(movie.id, {
      coverId: media.id,
    });
  }

  @Query(() => OffsetPaginatedMovies)
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  async getMoviesProtectedOffset(
    @Args() { sort, filter, ...pagination }: GetMoviesOffsetArgs,
  ) {
    const [data, count] = await Promise.all([
      this.movieService.readMany(pagination, sort, filter),
      this.movieService.count(filter),
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

  @Query(() => RelayPaginatedMovies)
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  async getMoviesProtectedRelay(
    @Args() { sort, filter, ...pagination }: GetMoviesRelayArgs,
  ) {
    const data = await this.movieService.readMany(pagination, sort, filter);

    const { first, last } = pagination;

    const edges = data.map((node) => ({
      node,
      cursor: String(node.id),
    }));

    if ((!last && data.length > first) || (!first && data.length > last)) {
      edges.pop();
    }

    return {
      edges: !!last ? edges.reverse() : edges,
      pageInfo: {
        hasNextPage: !last && data.length > first,
        hasPreviousPage: !first && data.length > last,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  }

  @Query(() => OffsetPaginatedMovies)
  async getMoviesOffset(
    @Args() { sort, filter, ...pagination }: GetMoviesOffsetArgs,
  ) {
    filter = {
      ...filter,
      accessMode: { eq: AccessModeEnum.PUBLIC },
    };
    const [data, count] = await Promise.all([
      this.movieService.readMany(pagination, sort, filter),
      this.movieService.count(filter),
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

  @Query(() => RelayPaginatedMovies)
  async getMoviesRelay(
    @Args() { sort, filter, ...pagination }: GetMoviesRelayArgs,
  ) {
    filter = {
      ...filter,
      accessMode: { eq: AccessModeEnum.PUBLIC },
    };
    const data = await this.movieService.readMany(pagination, sort, filter);

    const { first, last } = pagination;

    const edges = data.map((node) => ({
      node,
      cursor: String(node.id),
    }));

    if ((!last && data.length > first) || (!first && data.length > last)) {
      edges.pop();
    }

    return {
      edges: !!last ? edges.reverse() : edges,
      pageInfo: {
        hasNextPage: !last && data.length > first,
        hasPreviousPage: !first && data.length > last,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  }

  @Query(() => [MovieEntity])
  getRandomMovies(
    @Args() { sort, filter, ...pagination }: GetMoviesOffsetArgs,
  ) {
    return this.movieService.readManyRandom(pagination);
  }

  @Query(() => MovieEntity)
  getMovie(@Args('id', ParseUUIDPipe) id: string) {
    return this.movieService.readOne(id);
  }

  @Mutation(() => MovieEntity)
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  updateMovie(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('input') input: UpdateMovieInput,
  ) {
    return this.movieService.update(id, input);
  }

  @Mutation(() => MovieEntity)
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  deleteMovie(@Args('id', ParseUUIDPipe) id: string) {
    return this.movieService.delete(id);
  }
}
