import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PurchaseEntity } from './entities/purchase.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeService } from '../stripe/stripe.service';
import { UserService } from '../user/user.service';
import { BaseService } from '@common/services';
import { AlreadyExistsError } from '@utils/errors';
import { PriceService } from 'src/price/price.service';

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
    private readonly priceService: PriceService,
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
