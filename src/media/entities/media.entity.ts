import { ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FilterableField } from '@common/filter';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';

@ObjectType('Media')
@Entity('media')
export class MediaEntity {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @FilterableField(() => MediaTypeEnum)
  @Column({ type: 'enum', enum: MediaTypeEnum })
  type: MediaTypeEnum;

  @FilterableField()
  @Column({ length: 4096 })
  url: string;
}
