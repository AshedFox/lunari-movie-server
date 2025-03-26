import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { PriceEntity } from '../../price/entities/price.entity';
import { PlanEntity } from '../../plan/entities/plan.entity';

@ObjectType('PlanPrice')
@Entity('plans_prices')
export class PlanPriceEntity {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid' })
  planId: string;

  @Field(() => PlanEntity)
  @ManyToOne(() => PlanEntity)
  plan: Relation<PlanEntity>;

  @Field(() => ID)
  @PrimaryColumn({ length: 255 })
  priceId: string;

  @Field(() => PriceEntity)
  @ManyToOne(() => PriceEntity)
  price: Relation<PriceEntity>;
}
