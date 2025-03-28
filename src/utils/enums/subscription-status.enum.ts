import { registerEnumType } from '@nestjs/graphql';

export enum SubscriptionStatusEnum {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
}

registerEnumType(SubscriptionStatusEnum, {
  name: 'SubscriptionStatusEnum',
});
