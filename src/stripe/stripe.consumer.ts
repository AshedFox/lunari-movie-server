import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StripeService } from './stripe.service';
import { Logger } from '@nestjs/common';
import { REMOVE_CUSTOMER_JOB, STRIPE_CLEANUP_QUEUE } from './stripe.constants';

@Processor(STRIPE_CLEANUP_QUEUE)
export class StripeConsumer extends WorkerHost {
  private readonly logger = new Logger(StripeConsumer.name);

  constructor(private readonly stripeService: StripeService) {
    super();
  }

  async process(job: Job<{ customerId: string }>): Promise<any> {
    switch (job.name) {
      case REMOVE_CUSTOMER_JOB:
        this.logger.log(`Removing Stripe customer: ${job.data.customerId}`);
        await this.stripeService.removeCustomer(job.data.customerId);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
