import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { MoviePersonTypeEntity } from '../../movie-person-type/entities/movie-person-type.entity';
import { MovieEntity } from '../../movie/entities/movie.entity';
import { PersonEntity } from '../../person/entities/person.entity';
import { FilterableField, FilterableRelation } from '@common/filter';

@ObjectType('MoviePerson')
@Entity('movies_persons')
@Unique(['movieId', 'personId', 'typeId'])
export class MoviePersonEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @FilterableRelation(() => MovieEntity)
  @ManyToOne(() => MovieEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  movie: Relation<MovieEntity>;

  @Field(() => PersonEntity)
  @ManyToOne(() => PersonEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  person: Relation<PersonEntity>;

  @FilterableField()
  @Column()
  @Index()
  movieId: string;

  @FilterableField()
  @Column()
  @Index()
  personId: number;

  @FilterableField({ nullable: true })
  @Column({ nullable: true, length: 255 })
  role?: string;

  @FilterableField()
  @Column()
  @Index()
  typeId: number;

  @FilterableRelation(() => MoviePersonTypeEntity)
  @ManyToOne(() => MoviePersonTypeEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  type: Relation<MoviePersonTypeEntity>;
}
