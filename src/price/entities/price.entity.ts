import { Field, HideField, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { CurrencyEntity } from '../../currency/entities/currency.entity';
import { PlanIntervalEnum } from '@utils/enums/plan-interval.enum';

@ObjectType('Price')
@Entity('prices')
export class PriceEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'char', length: 3 })
  currencyId: string;

  @Field(() => CurrencyEntity)
  @ManyToOne(() => CurrencyEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  currency: Relation<CurrencyEntity>;

  @Field(() => Int)
  @Column({ type: 'int4' })
  amount: number;

  @FilterableField()
  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: PlanIntervalEnum,
    enumName: 'plan_interval_enum',
    nullable: true,
  })
  interval?: PlanIntervalEnum;

  @HideField()
  @Column({ length: 255, unique: true })
  stripePriceId: string;
}
