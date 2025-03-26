import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PurchaseEntity } from './entities/purchase.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeService } from '../stripe/stripe.service';
import { UserService } from '../user/user.service';
import { BaseService } from '@common/services';
import { AlreadyExistsError } from '@utils/errors';

@Injectable()
export class PurchaseService extends BaseService<
  PurchaseEntity,
  Partial<PurchaseEntity>,
  Partial<PurchaseEntity>
> {
  constructor(
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepository: Repository<PurchaseEntity>,
    private readonly userService: UserService,
    private readonly stripeService: StripeService,
  ) {
    super(purchaseRepository);
  }

  createSession = async (
    movieId: string,
    userId: string,
    priceId: string,
  ): Promise<string> => {
    if (await this.exists({ movieId, userId })) {
      throw new AlreadyExistsError('User already purchased this movie!');
    }

    const { customerId } = await this.userService.readOneById(userId);

    const session = await this.stripeService.createPurchaseSession(
      customerId,
      price.stripePriceId,
      priceId,
      userId,
      movieId,
    );

    return session.url;
  };
}
