import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { SeriesEntity } from '../../series/entities/series.entity';
import { EpisodeEntity } from '../../episode/entities/episode.entity';
import { FilterableField, FilterableRelation } from '@common/filter';
import { AccessModeEnum } from '@utils/enums/access-mode.enum';
import { AgeRestrictionEnum } from '@utils/enums/age-restriction.enum';

@ObjectType('Season')
@Entity('seasons')
@Unique(['numberInSeries', 'seriesId'])
export class SeasonEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @FilterableField(() => Int)
  @Column({ type: 'int2' })
  numberInSeries: number;

  @FilterableField({ nullable: true })
  @Column({ nullable: true, length: 255 })
  title?: string;

  @FilterableField({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @FilterableField(() => AgeRestrictionEnum, { nullable: true })
  @Column({
    type: 'enum',
    enum: AgeRestrictionEnum,
  })
  ageRestriction?: AgeRestrictionEnum;

  @FilterableField({ nullable: true })
  @Column({ nullable: true })
  @Index({ where: 'start_release_date IS NOT NULL' })
  startReleaseDate?: Date;

  @FilterableField({ nullable: true })
  @Column({ nullable: true })
  @Index({ where: 'end_release_date IS NOT NULL' })
  endReleaseDate?: Date;

  @FilterableField()
  @CreateDateColumn()
  createdAt: Date;

  @FilterableField()
  @UpdateDateColumn()
  updatedAt: Date;

  @FilterableField(() => AccessModeEnum)
  @Column({
    type: 'enum',
    enum: AccessModeEnum,
    default: AccessModeEnum.PRIVATE,
  })
  @Index({ where: "access_mode = 'PUBLIC'" })
  accessMode: AccessModeEnum;

  @Field(() => Int)
  episodesCount: number;

  @FilterableField()
  @Column()
  seriesId: string;

  @FilterableRelation(() => SeriesEntity)
  @ManyToOne(() => SeriesEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  series: Relation<SeriesEntity>;

  @Field(() => [EpisodeEntity])
  @OneToMany(() => EpisodeEntity, (episode) => episode.season)
  episodes: Relation<EpisodeEntity[]>;
}
