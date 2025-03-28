import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PlanEntity } from './entities/plan.entity';
import { DataSource, Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { CreatePlanInput } from './dto/create-plan.input';
import { PriceService } from '../price/price.service';
import { BaseService } from '@common/services';
import { PlanPriceService } from '../plan-price/plan-price.service';
import { PriceEntity } from 'src/price/entities/price.entity';

@Injectable()
export class PlanService extends BaseService<
  PlanEntity,
  CreatePlanInput,
  Partial<PlanEntity>
> {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(PlanEntity)
    planRepository: Repository<PlanEntity>,
    private readonly stripeService: StripeService,
    private readonly priceService: PriceService,
    private readonly planPriceService: PlanPriceService,
  ) {
    super(planRepository);
  }

  create = async (input: CreatePlanInput): Promise<PlanEntity> => {
    const product = await this.stripeService.createProduct(input.name);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const created: {
      plan?: PlanEntity;
      prices: PriceEntity[];
    } = {
      prices: [],
    };

    try {
      created.plan = await queryRunner.manager.getRepository(PlanEntity).save({
        name: input.name,
        stripeProductId: product.id,
      });

      for (const price of input.prices) {
        created.prices.push(
          await this.priceService.create(
            {
              ...price,
              productId: product.id,
            },
            queryRunner.manager,
          ),
        );
      }
      await this.planPriceService.createMany(
        created.prices.map((p) => ({ planId: created.plan.id, priceId: p.id })),
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();

      return created.plan;
    } catch {
      await queryRunner.rollbackTransaction();

      for (const price of created.prices) {
        try {
          await this.stripeService.disactivatePrice(price.stripePriceId);
        } catch (e) {
          console.error(e);
        }
      }

      await this.stripeService.removeProduct(created.plan.stripeProductId);
    } finally {
      await queryRunner.release();
    }
  };
}
