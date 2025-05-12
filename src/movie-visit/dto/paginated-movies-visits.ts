import { Paginated } from '@/common/pagination/offset';
import { MovieVisitEntity } from '../entities/movie-visit.entity';
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaginatedMoviesVisits extends Paginated(MovieVisitEntity) {}
