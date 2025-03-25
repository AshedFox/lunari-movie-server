import { FilterType } from '@common/filter';
import { MovieVisitStatsLastMonthView } from './entities/movie-visit-stats-last-month.view';
import { SortType } from '@common/sort';
import { OffsetPaginationArgsType } from '@common/pagination/offset';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieVisitStatsEntity } from './entities/movie-visit-stats.entity';
import { Repository } from 'typeorm';
import { getCount, getMany } from '@common/typeorm-query-parser';

@Injectable()
export class MovieVisitStatsLastMonthService {
  constructor(
    @InjectRepository(MovieVisitStatsLastMonthView)
    private readonly movieVisitStatsLastMonthRepository: Repository<MovieVisitStatsEntity>,
  ) {}

  updateView = async () => {
    await this.movieVisitStatsLastMonthRepository.query(
      'REFRESH MATERIALIZED VIEW "movies_visits_stats_last_month"',
    );
    return true;
  };

  readMany = async (
    filter?: FilterType<MovieVisitStatsLastMonthView>,
    sort?: SortType<MovieVisitStatsLastMonthView>,
    pagination?: OffsetPaginationArgsType,
  ) => {
    const data = await getMany(
      this.movieVisitStatsLastMonthRepository,
      pagination,
      sort,
      filter,
    );
    const count = await getCount(
      this.movieVisitStatsLastMonthRepository,
      filter,
    );

    const { limit, offset } = pagination;

    return {
      nodes: data,
      pageInfo: {
        totalCount: count,
        hasNextPage: count > limit + offset,
        hasPreviousPage: offset > 0,
      },
    };
  };
}
