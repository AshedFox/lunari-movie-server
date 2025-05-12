import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserEntity } from '@/user/entities/user.entity';
import { FilterableField } from '@/common/filter';
import { Field, ObjectType } from '@nestjs/graphql';
import { MovieEntity } from '@/movie/entities/movie.entity';

@ObjectType('MovieVisit')
@Entity('movies_visits')
export class MovieVisitEntity {
  @FilterableField()
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Field()
  @Column()
  ip: string;

  @FilterableField({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index({ where: 'user_id IS NOT NULL' })
  userId?: string;

  @Field(() => UserEntity, { nullable: true })
  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  user?: Relation<UserEntity>;

  @FilterableField()
  @Column('uuid')
  @Index()
  movieId: string;

  @Field(() => MovieEntity)
  @ManyToOne(() => MovieEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  movie: Relation<MovieEntity>;

  @FilterableField()
  @CreateDateColumn()
  @Index()
  visitedAt: Date;
}
