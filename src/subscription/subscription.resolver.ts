import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { SubscriptionService } from './subscription.service';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../user/dto/current-user.dto';
import { SubscriptionEntity } from './entities/subscription.entity';
import { UserEntity } from '../user/entities/user.entity';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { PriceEntity } from '../price/entities/price.entity';
import { SubscriptionStatusEnum } from '@utils/enums/subscription-status.enum';

@Resolver(SubscriptionEntity)
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Boolean)
  hasActiveSubscription(@CurrentUser() user: CurrentUserDto) {
    return this.subscriptionService.exists({
      userId: user.id,
      status: SubscriptionStatusEnum.ACTIVE,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => SubscriptionEntity)
  getUserSubscription(@CurrentUser() user: CurrentUserDto) {
    return this.subscriptionService.readActiveForUser(user.id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => String)
  createSubscriptionsManageLink(@CurrentUser() user: CurrentUserDto) {
    return this.subscriptionService.createManageLink(user.id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => String)
  subscribe(
    @CurrentUser() user: CurrentUserDto,
    @Args('priceId') priceId: string,
  ) {
    return this.subscriptionService.createSession(user.id, priceId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  cancelSubscription(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ) {
    return this.subscriptionService.requestCancel(user.id, id);
  }

  /*  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Cron(CronExpression.EVERY_HOUR)
  @Mutation(() => Boolean)
  makeExpiredSubscriptionsInactive() {
    this.subscriptionService.makeExpiredInactive();
    return true;
  }*/

  @ResolveField(() => UserEntity)
  user(
    @Parent() subscription: SubscriptionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(UserEntity, 'id')
      .load(subscription.userId);
  }

  @ResolveField(() => PriceEntity)
  price(
    @Parent() subscription: SubscriptionEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(PriceEntity, 'id')
      .load(subscription.priceId);
  }
}
