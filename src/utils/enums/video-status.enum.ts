import { registerEnumType } from '@nestjs/graphql';

export enum VideoStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(VideoStatusEnum, {
  name: 'VideoStatusEnum',
});
