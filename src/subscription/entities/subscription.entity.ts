import { Field, HideField, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { PriceEntity } from '../../price/entities/price.entity';
import { SubscriptionStatusEnum } from '@utils/enums';

@ObjectType('ServiceSubscription')
@Entity('subscriptions')
export class SubscriptionEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  periodStart: Date;

  @Field()
  @Column()
  periodEnd: Date;

  @Field(() => SubscriptionStatusEnum)
  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
  })
  status: SubscriptionStatusEnum;

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

  @HideField()
  @Column({ length: 255, unique: true })
  stripeSubscriptionId: string;
}
