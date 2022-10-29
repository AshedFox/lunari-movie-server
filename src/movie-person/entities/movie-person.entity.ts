import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MovieEntity } from '../../movie/entities/movie.entity';
import { PersonEntity } from '../../person/entities/person.entity';
import { MoviePersonTypeEnum } from '../../utils/enums/movie-person-type.enum';
import { FilterableField } from '../../common/filter';

@ObjectType()
@Entity({ name: 'movies_persons' })
export class MoviePersonEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => MovieEntity)
  @ManyToOne(() => MovieEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  movie: MovieEntity;

  @Field(() => PersonEntity)
  @ManyToOne(() => PersonEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  person: PersonEntity;

  @FilterableField()
  @Column()
  movieId: string;

  @FilterableField()
  @Column()
  personId: number;

  @FilterableField({ nullable: true })
  @Column({ nullable: true })
  role?: string;

  @FilterableField(() => MoviePersonTypeEnum)
  @Column({ type: 'enum', enum: MoviePersonTypeEnum })
  type: MoviePersonTypeEnum;
}
