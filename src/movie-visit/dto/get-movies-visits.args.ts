import { GqlArgs } from '@/common/args';
import { MovieVisitEntity } from '../entities/movie-visit.entity';
import { ArgsType } from '@nestjs/graphql';

@ArgsType()
export class GetMoviesVisitsArgs extends GqlArgs(MovieVisitEntity) {}
