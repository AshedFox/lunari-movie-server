import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeService } from '../stripe/stripe.service';
import { UserService } from '../user/user.service';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { SubscriptionEntity } from './entities/subscription.entity';
import { BaseService } from '@common/services';
import { PriceService } from '../price/price.service';
import { SubscriptionStatusEnum } from '@utils/enums/subscription-status.enum';

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

  createSession = async (userId: string, priceId: string): Promise<string> => {
    if (await this.exists({ userId, status: SubscriptionStatusEnum.ACTIVE })) {
      throw new AlreadyExistsError('User already have active subscription!');
    }
    const user = await this.userService.readOneById(userId);
    const price = await this.priceService.readOne(priceId);
    let customerId = user.customerId;

    const session = await this.stripeService.createSubscriptionSession(
      customerId,
      price.stripePriceId,
      priceId,
      userId,
      price.currencyId,
    );

    return session.url;
  };

  requestCancel = async (
    userId: string,
    subscriptionId: string,
  ): Promise<boolean> => {
    const subscription = await this.subscriptionRepository.findOneBy({
      id: subscriptionId,
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found for this user!');
    }

    await this.stripeService.cancelSubscription(subscriptionId);

    return true;
  };
}
