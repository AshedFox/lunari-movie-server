import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { FilterableField } from '@common/filter';
import { VideoVariantEntity } from '../../video-variant/entities/video-variant.entity';
import { SubtitlesEntity } from '../../subtitles/entities/subtitles.entity';
import { MediaEntity } from '../../media/entities/media.entity';
import { VideoAudioEntity } from '../../video-audio/entities/video-audio.entity';
import { VideoStatusEnum } from '@/utils/enums/video-status.enum';

@ObjectType('Video')
@Entity('videos')
export class VideoEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn({ type: 'int4' })
  id: number;

  @Column({
    type: 'enum',
    enum: VideoStatusEnum,
    default: VideoStatusEnum.PENDING,
  })
  @Field(() => VideoStatusEnum)
  status: VideoStatusEnum;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  originalMediaId?: string;

  @Field(() => MediaEntity, { nullable: true })
  @ManyToOne(() => MediaEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  originalMedia?: Relation<MediaEntity>;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  dashManifestMediaId?: string;

  @Field(() => MediaEntity, { nullable: true })
  @ManyToOne(() => MediaEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  dashManifestMedia?: Relation<MediaEntity>;

  @Field(() => [VideoVariantEntity])
  @OneToMany(() => VideoVariantEntity, (videoVariant) => videoVariant.videoId)
  variants: Relation<VideoVariantEntity[]>;

  @Field(() => [VideoAudioEntity])
  @OneToMany(() => VideoAudioEntity, (videoAudio) => videoAudio.video)
  audios: Relation<VideoAudioEntity[]>;

  @Field(() => [SubtitlesEntity])
  @OneToMany(() => SubtitlesEntity, (subtitles) => subtitles.videoId)
  subtitles: Relation<SubtitlesEntity[]>;
}
