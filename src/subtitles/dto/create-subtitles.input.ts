import { Field, InputType, Int } from '@nestjs/graphql';
import { IsUUID, Length } from 'class-validator';

@InputType()
export class CreateSubtitlesInput {
  @Field(() => Int)
  videoId: number;

  @Field()
  @Length(5, 6)
  languageId: string;

  @Field()
  @IsUUID()
  fileId: string;
}
