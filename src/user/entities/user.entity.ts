import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Field, HideField, ID, ObjectType } from '@nestjs/graphql';
import { RoleEnum } from '@utils/enums';
import { CountryEntity } from '../../country/entities/country.entity';
import { MediaEntity } from '../../media/entities/media.entity';
import { FilterableField } from '@common/filter';
import { PurchaseEntity } from '../../purchase/entities/purchase.entity';
import { SubscriptionEntity } from '../../subscription/entities/subscription.entity';
import { RoomEntity } from '../../room/entities/room.entity';

@ObjectType('User')
@Entity('users')
export class UserEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @FilterableField()
  @Column({ unique: true, length: 320 })
  email: string;

  @FilterableField()
  @Column({ default: false })
  @Index()
  isEmailConfirmed: boolean;

  @HideField()
  @Column()
  password: string;

  @FilterableField()
  @Column({ length: 255 })
  name: string;

  @FilterableField()
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @FilterableField()
  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  @FilterableField(() => RoleEnum)
  @Column({
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.User,
  })
  @Index()
  role: RoleEnum;

  @FilterableField({ nullable: true })
  @Column({ nullable: true, type: 'char', length: 2 })
  @Index({ where: 'country_id IS NOT NULL' })
  countryId?: string;

  @Field(() => CountryEntity, { nullable: true })
  @ManyToOne(() => CountryEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  country?: Relation<CountryEntity>;

  @HideField()
  @Column({ length: 255, nullable: true })
  customerId?: string;

  @FilterableField({ nullable: true })
  @Column({ nullable: true, type: 'uuid' })
  @Index({ where: 'avatar_id IS NOT NULL' })
  avatarId?: string;

  @Field(() => MediaEntity, { nullable: true })
  @ManyToOne(() => MediaEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  avatar?: Relation<MediaEntity>;

  @Field(() => [PurchaseEntity])
  @OneToMany(() => PurchaseEntity, (purchase) => purchase.user)
  purchases: Relation<PurchaseEntity[]>;

  @Field(() => [SubscriptionEntity])
  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.user)
  subscriptions: Relation<SubscriptionEntity[]>;

  @Field(() => [RoomEntity])
  @OneToMany(() => RoomEntity, (room) => room.owner)
  rooms: Relation<RoomEntity[]>;
}
