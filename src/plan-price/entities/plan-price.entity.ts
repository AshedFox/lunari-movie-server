import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { PriceEntity } from '../../price/entities/price.entity';
import { PlanEntity } from '../../plan/entities/plan.entity';
import { FilterableField, FilterableRelation } from '@common/filter';

@ObjectType('PlanPrice')
@Entity('plans_prices')
export class PlanPriceEntity {
  @FilterableField(() => ID)
  @PrimaryColumn({ type: 'uuid' })
  planId: string;

  @Field(() => PlanEntity)
  @ManyToOne(() => PlanEntity)
  plan: Relation<PlanEntity>;

  @FilterableField(() => ID)
  @PrimaryColumn({ type: 'uuid' })
  priceId: string;

  @FilterableRelation(() => PriceEntity)
  @ManyToOne(() => PriceEntity)
  price: Relation<PriceEntity>;
}
