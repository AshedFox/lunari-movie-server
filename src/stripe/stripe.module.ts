import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { BullModule } from '@nestjs/bullmq';
import { StripeConsumer } from './stripe.consumer';
import { STRIPE_CLEANUP_QUEUE } from './stripe.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: STRIPE_CLEANUP_QUEUE,
    }),
  ],
  providers: [StripeService, StripeController, StripeConsumer],
  controllers: [StripeController],
  exports: [StripeService, BullModule],
})
export class StripeModule {}
