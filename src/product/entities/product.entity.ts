import { Field, HideField, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { PriceEntity } from '../../price/entities/price.entity';
import { MovieEntity } from '../../movie/entities/movie.entity';
import { ProductPriceEntity } from '../../product-price/entities/product-price.entity';

@ObjectType('Product')
@Entity('products')
export class ProductEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ default: true })
  active: boolean;

  @Field(() => ID)
  @Column()
  movieId: string;

  @Field(() => MovieEntity)
  @OneToOne(() => MovieEntity, (movie) => movie.product)
  movie: Relation<MovieEntity>;

  @Field(() => [PriceEntity])
  prices: Relation<PriceEntity[]>;

  @HideField()
  @OneToMany(() => ProductPriceEntity, (productPrice) => productPrice.product)
  pricesConnection: Relation<ProductPriceEntity[]>;

  @HideField()
  @Column({ length: 255, unique: true })
  stripeProductId: string;
}
