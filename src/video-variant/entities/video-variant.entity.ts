import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { MediaEntity } from '../../media/entities/media.entity';
import { VideoProfileEnum } from '@utils/enums/video-profile.enum';
import { VideoEntity } from '../../video/entities/video.entity';
import { FilterableField } from '@common/filter';

@ObjectType('VideoVariant')
@Entity('videos_variants')
@Unique(['videoId', 'profile'])
export class VideoVariantEntity {
  @FilterableField()
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @FilterableField(() => Int)
  @Column({ type: 'int4' })
  videoId: number;

  @Field(() => VideoEntity)
  @ManyToOne(() => VideoEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  video: Relation<VideoEntity>;

  @Field()
  @Column({ type: 'uuid' })
  mediaId: string;

  @Field(() => MediaEntity)
  @ManyToOne(() => MediaEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  media: Relation<MediaEntity>;

  @FilterableField(() => VideoProfileEnum)
  @Column({
    type: 'enum',
    enum: VideoProfileEnum,
  })
  profile: VideoProfileEnum;
}
