import {
  Args,
  Int,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Root,
  Subscription,
} from '@nestjs/graphql';
import { VideoVariantEntity } from './entities/video-variant.entity';
import { VideoVariantService } from './video-variant.service';
import { CreateVideoVariantInput } from './dto/create-video-variant.input';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@utils/enums';
import { VideoEntity } from '../video/entities/video.entity';
import { MediaEntity } from '../media/entities/media.entity';
import { UpdateVideoVariantInput } from './dto/update-video-variant.input';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { PubSub } from 'graphql-subscriptions';
import { GenerateVideoVariantsInput } from './dto/generate-video-variants.input';
import { VideoVariantsProgressDto } from './dto/video-variants-progress.dto';

@Resolver(() => VideoVariantEntity)
export class VideoVariantResolver {
  constructor(
    private readonly videoVariantService: VideoVariantService,
    @Inject('PUB_SUB')
    private readonly pubSub: PubSub,
  ) {}

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => VideoVariantEntity)
  createVideoVariant(@Args('input') input: CreateVideoVariantInput) {
    return this.videoVariantService.create(input);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => Boolean)
  generateVideoVariants(
    @Args('input')
    input: GenerateVideoVariantsInput,
  ) {
    this.videoVariantService.generateVideoVariants(input, (data) =>
      this.pubSub.publish(`videoVariantsProgress_${input.videoId}`, data),
    );

    return true;
  }

  @Query(() => [VideoVariantEntity])
  getVideosVariants() {
    return this.videoVariantService.readMany();
  }

  @Query(() => VideoVariantEntity)
  getVideoVariant(@Args('id', { type: () => Int }) id: number) {
    return this.videoVariantService.readOne(id);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => VideoVariantEntity)
  updateVideoVariant(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateVideoVariantInput,
  ) {
    return this.videoVariantService.update(id, input);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => VideoVariantEntity)
  deleteVideoVariant(@Args('id') id: number) {
    return this.videoVariantService.delete(id);
  }

  @ResolveField(() => VideoEntity)
  video(
    @Root() videoVariant: VideoVariantEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(VideoEntity, 'id')
      .load(videoVariant.videoId);
  }

  @ResolveField(() => MediaEntity)
  media(
    @Root() videoVariant: VideoVariantEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MediaEntity, 'id')
      .load(videoVariant.mediaId);
  }

  @Subscription(() => VideoVariantsProgressDto, {
    resolve: (value, { id }) => ({
      ...value,
      message: `video-${id}:video: ${value.message}`,
    }),
  })
  videoVariantsProgress(@Args('id', { type: () => Int }) id: number) {
    return this.pubSub.asyncIterableIterator<VideoVariantsProgressDto>(
      `videoVariantsProgress_${id}`,
    );
  }
}
