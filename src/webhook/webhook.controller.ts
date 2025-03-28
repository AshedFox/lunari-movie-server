import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';
import { PurchaseService } from '../purchase/purchase.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionStatusEnum } from '@utils/enums/subscription-status.enum';

@Controller('/webhook')
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly purchaseService: PurchaseService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('stripe')
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ recieved: boolean }> {
    if (!signature) {
      throw new BadRequestException('No stripe signature');
    }

    try {
      const event = this.stripeService.constructEvent(
        request.rawBody,
        signature,
      );

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const checkout = event.data.object;

          if (checkout.status === 'complete' && checkout.mode === 'payment') {
            const metadata = checkout.metadata;

            if (metadata.movieId && metadata.userId && metadata.priceId) {
              await this.purchaseService.create({
                stripePaymentId: checkout.id,
                userId: metadata.userId,
                movieId: metadata.movieId,
                priceId: metadata.priceId,
                madeAt: new Date(checkout.created * 1000),
              });
            }
          }

          break;
        }
        case 'customer.subscription.created': {
          const subscription = event.data.object;

          if (subscription.metadata.userId) {
            await this.subscriptionService.create({
              stripeSubscriptionId: subscription.id,
              userId: subscription.metadata.userId,
              status: SubscriptionStatusEnum.ACTIVE,
              priceId: subscription.metadata.priceId,
              periodStart: new Date(subscription.current_period_start * 1000),
              periodEnd: new Date(subscription.current_period_end * 1000),
            });
          }

          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object;

          if (
            subscription.status === 'active' ||
            subscription.status === 'canceled' ||
            subscription.status === 'past_due'
          ) {
            await this.subscriptionService.updateFromStripe(subscription.id, {
              status: subscription.status as SubscriptionStatusEnum,
              periodStart: new Date(subscription.current_period_start * 1000),
              periodEnd: new Date(subscription.current_period_end * 1000),
            });
          }

          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;

          await this.subscriptionService.updateFromStripe(subscription.id, {
            status: SubscriptionStatusEnum.CANCELED,
          });

          break;
        }
      }

      return { recieved: true };
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
