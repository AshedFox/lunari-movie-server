import { VideoStatusEnum } from '@/utils/enums/video-status.enum';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StreamingGenerationProgressDto {
  @Field()
  type: 'info' | 'error';

  @Field()
  message: string;

  @Field(() => VideoStatusEnum)
  status: VideoStatusEnum;
}
