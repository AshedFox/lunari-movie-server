import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieVisitEntity } from './entities/movie-visit.entity';
import { MovieVisitService } from './movie-visit.service';
import { MovieVisitResolver } from './movie-visit.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([MovieVisitEntity])],
  providers: [MovieVisitService, MovieVisitResolver],
  exports: [MovieVisitService],
})
export class MovieVisitModule {}
