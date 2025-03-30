import { Field, HideField, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { PriceEntity } from '../../price/entities/price.entity';
import { PlanPriceEntity } from '../../plan-price/entities/plan-price.entity';
import { FilterableField, FilterableRelation } from '@common/filter';

@ObjectType('Plan')
@Entity('plans')
export class PlanEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 255 })
  name: string;

  @FilterableField()
  @Column({ default: true })
  active: boolean;

  @Field(() => [PriceEntity])
  prices: Relation<PriceEntity[]>;

  @FilterableRelation(() => [PlanPriceEntity], { hide: true })
  @OneToMany(
    () => PlanPriceEntity,
    (subscriptionPrice) => subscriptionPrice.plan,
  )
  pricesConnection: Relation<PlanPriceEntity[]>;

  @HideField()
  @Column({ length: 255, unique: true })
  stripeProductId: string;
}
