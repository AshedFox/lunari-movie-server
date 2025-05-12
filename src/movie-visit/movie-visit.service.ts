import { BaseService } from '@/common/services';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMovieVisitInput } from './dto/create-movie-visit.input';
import { MovieVisitEntity } from './entities/movie-visit.entity';

@Injectable()
export class MovieVisitService extends BaseService<
  MovieVisitEntity,
  CreateMovieVisitInput,
  object
> {
  constructor(
    @InjectRepository(MovieVisitEntity)
    visitRepository: Repository<MovieVisitEntity>,
  ) {
    super(visitRepository);
  }
}
