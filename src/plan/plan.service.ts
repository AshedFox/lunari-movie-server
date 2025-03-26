import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanEntity } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { CreatePlanInput } from './dto/create-plan.input';
import { PriceService } from '../price/price.service';
import { BaseService } from '@common/services';
import { PlanPriceService } from '../plan-price/plan-price.service';

@Injectable()
export class PlanService extends BaseService<
  PlanEntity,
  CreatePlanInput,
  Partial<PlanEntity>
> {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
    private readonly stripeService: StripeService,
    private readonly priceService: PriceService,
    private readonly planPriceService: PlanPriceService,
  ) {
    super(planRepository);
  }

  create = async (input: CreatePlanInput): Promise<PlanEntity> => {
    const product = await this.stripeService.createProduct(input.name);

    const plan = await this.planRepository.save({
      stripeProductId: product.id,
      name: input.name,
    });

    for (const price of input.prices) {
      const p = await this.priceService.create({
        ...price,
        productId: product.id,
      });
      await this.planPriceService.create(plan.id, p.id);
    }

    return plan;
  };
}
