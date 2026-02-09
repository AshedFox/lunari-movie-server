import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { AgeRestrictionEnum } from '@utils/enums/age-restriction.enum';
import { SeasonEntity } from '../../season/entities/season.entity';
import { SeriesEntity } from '../../series/entities/series.entity';
import { AccessModeEnum } from '@utils/enums/access-mode.enum';
import { FilterableField, FilterableRelation } from '@common/filter';
import { VideoEntity } from '../../video/entities/video.entity';
import { Expose } from 'class-transformer';
import { MediaEntity } from '../../media/entities/media.entity';

@ObjectType('Episode')
@Entity('episodes')
@Unique(['numberInSeries', 'seriesId'])
@Unique(['numberInSeason', 'seasonId'])
export class EpisodeEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
  @Index({ where: 'release_date IS NOT NULL' })
  releaseDate?: Date;

  @FilterableField()
  @CreateDateColumn()
  publicationDate: Date;

  @FilterableField({ nullable: true })
  @Column({ nullable: true, type: 'uuid' })
  @Expose({ name: 'cover_id' })
  @Index({ where: 'cover_id IS NOT NULL' })
  coverId?: string;

  @FilterableRelation(() => MediaEntity, { nullable: true })
  @ManyToOne(() => MediaEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  cover?: Relation<MediaEntity>;

  @FilterableField(() => AccessModeEnum)
  @Column({
    type: 'enum',
    enum: AccessModeEnum,
    default: AccessModeEnum.PRIVATE,
  })
  @Index({ where: "access_mode = 'PUBLIC'" })
  accessMode: AccessModeEnum;

  @FilterableField(() => Int)
  @Column({ type: 'int2' })
  numberInSeries: number;

  @FilterableField(() => Int)
  @Column({ type: 'int2' })
  numberInSeason: number;

  @FilterableField()
  @Column()
  @Index()
  seasonId: string;

  @Field(() => SeasonEntity)
  @ManyToOne(() => SeasonEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  season: Relation<SeasonEntity>;

  @FilterableField()
  @Column()
  @Index()
  seriesId: string;

  @Field(() => SeriesEntity)
  @ManyToOne(() => SeriesEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  series: Relation<SeriesEntity>;

  @FilterableField({ nullable: true })
  @Column({ nullable: true, type: 'int4' })
  @Index({ where: 'video_id IS NOT NULL' })
  videoId?: number;

  @Field(() => VideoEntity, { nullable: true })
  @OneToOne(() => VideoEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  video?: Relation<VideoEntity>;
}
