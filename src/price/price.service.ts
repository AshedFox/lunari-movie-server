import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceEntity } from './entities/price.entity';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { BaseService } from '@common/services';
import { StripeService } from '../stripe/stripe.service';
import { CreatePriceInput } from './dto/create-price.input';

@Injectable()
export class PriceService extends BaseService<
  PriceEntity,
  CreatePriceInput,
  DeepPartial<PriceEntity>
> {
  constructor(
    @InjectRepository(PriceEntity)
    private readonly priceRepository: Repository<PriceEntity>,
    private readonly stripeService: StripeService,
  ) {
    super(priceRepository);
  }

  create = async (
    input: CreatePriceInput,
    entityManager?: EntityManager,
  ): Promise<PriceEntity> => {
    const repository = entityManager
      ? entityManager.getRepository(PriceEntity)
      : this.priceRepository;

    const stripePrice = await this.stripeService.createPrice(
      input.productId,
      input.currencyId,
      input.amount,
      input.interval,
    );
    return repository.save({
      ...input,
      stripePriceId: stripePrice.id,
    });
  };
}
