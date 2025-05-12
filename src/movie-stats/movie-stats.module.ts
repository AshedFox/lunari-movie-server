import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieStatsMaterializedView } from './entities/movie-stats.view';
import { MovieStatsService } from './movie-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovieStatsMaterializedView])],
  providers: [MovieStatsService],
  exports: [MovieStatsService],
})
export class MovieStatsModule {}
