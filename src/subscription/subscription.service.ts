import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeService } from '../stripe/stripe.service';
import { UserService } from '../user/user.service';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { SubscriptionEntity } from './entities/subscription.entity';
import { BaseService } from '@common/services';
import { PriceService } from '../price/price.service';
import { SubscriptionStatusEnum } from '@utils/enums/subscription-status.enum';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService extends BaseService<
  SubscriptionEntity,
  Partial<SubscriptionEntity>,
  Partial<SubscriptionEntity>
> {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly stripeService: StripeService,
    private readonly userService: UserService,
    private readonly priceService: PriceService,
  ) {
    super(subscriptionRepository);
  }

  readActiveForUser = (userId: string): Promise<SubscriptionEntity | null> => {
    return this.subscriptionRepository.findOneBy({
      status: SubscriptionStatusEnum.ACTIVE,
      userId,
    });
  };

  createManageLink = async (userId: string) => {
    const user = await this.userService.readOneById(userId);

    const session = await this.stripeService.createCustomerPortalSession(
      user.customerId,
    );

    return session.url;
  };

  activate = async (sessionId: string) => {
    const session = await this.stripeService.getCheckoutSession(sessionId);
    const subscription = session.subscription as Stripe.Subscription;

    if (session.status === 'complete') {
      const active = await this.readActiveForUser(subscription.metadata.userId);

      if (active && active.stripeSubscriptionId === subscription.id) {
        throw new ConflictException('Already exits');
      }
      await this.create({
        stripeSubscriptionId: subscription.id,
        userId: subscription.metadata.userId,
        status: SubscriptionStatusEnum.ACTIVE,
        priceId: subscription.metadata.priceId,
        periodStart: new Date(subscription.start_date * 1000),
        periodEnd: new Date(subscription.ended_at * 1000),
      });
      return true;
    }

    return false;
  };

  createSession = async (userId: string, priceId: string): Promise<string> => {
    if (await this.exists({ userId, status: SubscriptionStatusEnum.ACTIVE })) {
      throw new AlreadyExistsError('User already have active subscription!');
    }
    const user = await this.userService.readOneById(userId);
    const price = await this.priceService.readOne(priceId);
    let customerId = user.customerId;

    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      customerId = customer.id;
    }

    const session = await this.stripeService.createSubscriptionSession(
      customerId,
      price.stripePriceId,
      priceId,
      userId,
    );

    return session.url;
  };

  updateFromStripe = async (
    stripeSubscriptionId: string,
    input: Partial<SubscriptionEntity>,
  ): Promise<SubscriptionEntity> => {
    const entity = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
    });

    if (!entity) {
      throw new NotFoundException();
    }

    return this.subscriptionRepository.save({
      ...entity,
      ...input,
    });
  };

  requestCancel = async (
    userId: string,
    subscriptionId: string,
  ): Promise<boolean> => {
    const subscription = await this.subscriptionRepository.findOneBy({
      id: subscriptionId,
      userId,
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found for this user!');
    }

    await this.stripeService.cancelSubscription(subscriptionId);

    return true;
  };
}
