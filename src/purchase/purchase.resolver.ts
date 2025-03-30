import {
  Args,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Root,
} from '@nestjs/graphql';
import { PurchaseEntity } from './entities/purchase.entity';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { PurchaseService } from './purchase.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../user/dto/current-user.dto';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { MovieEntity } from '../movie/entities/movie.entity';
import { UserEntity } from '../user/entities/user.entity';

@Resolver(() => PurchaseEntity)
export class PurchaseResolver {
  constructor(private readonly purchaseService: PurchaseService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => String)
  createPurchaseSession(
    @CurrentUser() user: CurrentUserDto,
    @Args('priceId') priceId: string,
    @Args('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.purchaseService.createSession(movieId, user.id, priceId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => PurchaseEntity)
  getPurchase(@Args('id') id: number) {
    return this.purchaseService.readOne(id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [PurchaseEntity])
  getUserPurchases(@CurrentUser() user: CurrentUserDto) {
    return this.purchaseService.readMany(undefined, undefined, {
      userId: { eq: user.id },
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Boolean)
  hasPurchase(
    @Args('movieId') movieId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.purchaseService.exists({
      userId: user.id,
      movieId,
    });
  }

  @ResolveField(() => MovieEntity)
  movie(
    @Root() purchase: PurchaseEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MovieEntity, 'id')
      .load(purchase.movieId);
  }

  @ResolveField(() => UserEntity)
  user(
    @Root() purchase: PurchaseEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(UserEntity, 'id')
      .load(purchase.userId);
  }
}
