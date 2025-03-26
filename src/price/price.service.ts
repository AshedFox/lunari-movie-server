import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceEntity } from './entities/price.entity';
import { DeepPartial, Repository } from 'typeorm';
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

  create = async (input: CreatePriceInput): Promise<PriceEntity> => {
    const stripePrice = await this.stripeService.createPrice(
      input.productId,
      input.currencyId,
      input.amount,
      input.interval,
    );
    return this.priceRepository.save({
      ...input,
      stripePriceId: stripePrice.id,
    });
  };
}
