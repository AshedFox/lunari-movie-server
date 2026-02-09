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
import { VideoEntity } from '../../video/entities/video.entity';
import { LanguageEntity } from '../../language/entities/language.entity';
import { FilterableField } from '@common/filter';
import { AudioProfileEnum } from '@utils/enums/audio-profile.enum';

@ObjectType('VideoAudio')
@Entity('videos_audios')
@Unique(['videoId', 'languageId', 'profile'])
export class VideoAudioEntity {
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

  @FilterableField()
  @Column({ type: 'char', length: 3 })
  languageId: string;

  @Field(() => LanguageEntity)
  @ManyToOne(() => LanguageEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  language: Relation<LanguageEntity>;

  @FilterableField(() => AudioProfileEnum)
  @Column({
    type: 'enum',
    enum: AudioProfileEnum,
  })
  profile: AudioProfileEnum;
}
