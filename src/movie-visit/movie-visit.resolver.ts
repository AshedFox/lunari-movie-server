import { MovieVisitEntity } from './entities/movie-visit.entity';
import { MovieVisitService } from './movie-visit.service';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CurrentUserDto } from '@/user/dto/current-user.dto';
import { IpAddres } from '@/utils/decorators';
import { UseGuards } from '@nestjs/common';
import { GqlTryJwtAuthGuard } from '@/auth/guards/gql-try-jwt-auth.guard';
import { GetMoviesVisitsArgs } from './dto/get-movies-visits.args';
import { PaginatedMoviesVisits } from './dto/paginated-movies-visits';

@Resolver(() => MovieVisitEntity)
export class MovieVisitResolver {
  constructor(private readonly movieVisitService: MovieVisitService) {}

  @Mutation(() => MovieVisitEntity)
  @UseGuards(GqlTryJwtAuthGuard)
  trackMovieVisit(
    @IpAddres() ip: string,
    @Args('movieId') movieId: string,
    @CurrentUser() user?: CurrentUserDto,
  ) {
    return this.movieVisitService.create({
      ip,
      userId: user?.id,
      movieId,
    });
  }

  @Query(() => PaginatedMoviesVisits)
  async getMoviesVisits(
    @Args() { sort, filter, ...pagination }: GetMoviesVisitsArgs,
  ) {
    const [data, count] = await Promise.all([
      this.movieVisitService.readMany(pagination, sort, filter),
      this.movieVisitService.count(filter),
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

  @Query(() => MovieVisitEntity)
  getMovieVisit(@Args('id') id: number) {
    return this.movieVisitService.readOne(id);
  }
}
