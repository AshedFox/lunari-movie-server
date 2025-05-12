import { Index, ManyToOne, Relation, ViewColumn, ViewEntity } from 'typeorm';
import { MovieEntity } from '../../movie/entities/movie.entity';
import { ObjectType } from '@nestjs/graphql';
import { FilterableField, FilterableRelation } from '@common/filter';

@ObjectType('MovieStats')
@ViewEntity({
  name: 'movies_stats',
  materialized: true,
  expression: `
    WITH visits AS (
        SELECT 
            movie_id, 
            SUM(EXP(-0.02 * EXTRACT(DAY FROM NOW() - visited_at))) AS decayed_visits
        FROM movies_visits
        GROUP BY movie_id
    ),
    reviews AS (
        SELECT 
            movie_id, 
            COUNT(id) AS reviews
        FROM movies_reviews
        GROUP BY movie_id
    ),
    bookmarks AS (
        SELECT 
            movie_id, 
            COUNT(user_id) AS bookmarks
        FROM movies_users
        WHERE is_bookmarked = TRUE
        GROUP BY movie_id
    )
    SELECT 
        m.id as movie_id, 
        COALESCE(v.decayed_visits, 0)::DOUBLE PRECISION AS visits_count,
        COALESCE(r.reviews, 0) AS reviews_count,
        COALESCE(b.bookmarks, 0) AS bookmarks_count,
        (0.4 * LOG(1 + COALESCE(v.decayed_visits::DOUBLE PRECISION/10000, 0)) + 
        0.3 * LOG(1 + COALESCE(r.reviews::DOUBLE PRECISION/100, 0)) + 
        0.35 * LOG(1 + COALESCE(b.bookmarks::DOUBLE PRECISION/50, 0)))::DOUBLE PRECISION AS popularity_score
    FROM movies m
    LEFT JOIN visits v ON m.id = v.movie_id
    LEFT JOIN reviews r ON m.id = r.movie_id
    LEFT JOIN bookmarks b ON m.id = b.movie_id
    ORDER BY popularity_score DESC;
  `,
})
export class MovieStatsMaterializedView {
  @FilterableField()
  @ViewColumn()
  @Index({ unique: true })
  movieId: string;

  @FilterableRelation(() => MovieEntity)
  @ManyToOne(() => MovieEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  movie: Relation<MovieEntity>;

  @FilterableField()
  @ViewColumn()
  visitsCount: number;

  @FilterableField()
  @ViewColumn()
  reviewsCount: number;

  @FilterableField()
  @ViewColumn()
  bookmarksCount: number;

  @FilterableField()
  @ViewColumn()
  @Index()
  popularityScore: number;
}
