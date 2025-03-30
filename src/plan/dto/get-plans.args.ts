import { GqlArgs } from '@common/args';
import { ArgsType } from '@nestjs/graphql';
import { PlanEntity } from '../entities/plan.entity';

@ArgsType()
export class GetPlansArgs extends GqlArgs(PlanEntity, 'none') {}
