import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { MovieEntity } from '../../movie/entities/movie.entity';
import { PriceEntity } from '../../price/entities/price.entity';

@ObjectType('Purchase')
@Entity('purchases')
export class PurchaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  madeAt: Date;

  @Field()
  @Column({ type: 'uuid' })
  priceId: string;

  @Field(() => PriceEntity)
  @ManyToOne(() => PriceEntity)
  price: Relation<PriceEntity>;

  @Field()
  @Column({ type: 'uuid' })
  userId: string;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Field()
  @Column({ type: 'uuid' })
  movieId: string;

  @Field(() => MovieEntity)
  @ManyToOne(() => MovieEntity)
  movie: Relation<MovieEntity>;
}
