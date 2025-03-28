import {
  Args,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Root,
} from '@nestjs/graphql';
import { PlanEntity } from './entities/plan.entity';
import { PlanService } from './plan.service';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@utils/enums';
import { CreatePlanInput } from './dto/create-plan.input';
import { PriceEntity } from '../price/entities/price.entity';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { PlanPriceEntity } from '../plan-price/entities/plan-price.entity';
import { GetPlansArgs } from './dto/get-plans.args';

@Resolver(PlanEntity)
export class PlanResolver {
  constructor(private readonly planService: PlanService) {}

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin])
  @Mutation(() => PlanEntity)
  createPlan(@Args('input') input: CreatePlanInput) {
    return this.planService.create(input);
  }

  @Query(() => PlanEntity)
  getPlan(@Args('id') id: string) {
    return this.planService.readOne(id);
  }

  @Query(() => [PlanEntity])
  getPlans(@Args() { filter, sort }: GetPlansArgs) {
    return this.planService.readMany(undefined, sort, filter);
  }

  @ResolveField(() => [PriceEntity])
  prices(
    @Root() plan: PlanEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(
        PlanPriceEntity,
        'planId',
        PlanEntity,
        'id',
        'price',
        PriceEntity,
      )
      .load({ id: plan.id });
  }
}
