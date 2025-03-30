import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { VideoService } from './video.service';
import { VideoEntity } from './entities/video.entity';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@utils/enums';
import { PaginatedVideos } from './dto/paginated-videos';
import { GetVideosArgs } from './dto/get-videos.args';
import { VideoVariantEntity } from '../video-variant/entities/video-variant.entity';
import { SubtitlesEntity } from '../subtitles/entities/subtitles.entity';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { PubSub } from 'graphql-subscriptions';
import { MediaEntity } from '../media/entities/media.entity';
import { VideoAudioEntity } from '../video-audio/entities/video-audio.entity';
import { StreamingGenerationProgressDto } from './dto/streaming-generation-progress.dto';
import { CreateVideoInput } from './dto/create-video.input';
import { CreateStreamingDirectlyInput } from './dto/create-streaming-directly.input';

@Resolver(() => VideoEntity)
export class VideoResolver {
  constructor(
    private readonly videoService: VideoService,
    @Inject('PUB_SUB')
    private readonly pubSub: PubSub,
  ) {}

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin])
  @Mutation(() => Boolean)
  createStreamingForVideoDirectly(
    @Args('input') input: CreateStreamingDirectlyInput,
  ) {
    this.videoService.createStreamingDirectly(input, (data) =>
      this.pubSub.publish(`streamingGenerationProgress_${input.id}`, data),
    );
    return true;
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin])
  @Mutation(() => Boolean)
  createStreamingForVideo(@Args('id', { type: () => Int }) id: number) {
    this.videoService.createStreaming(id, (data) =>
      this.pubSub.publish(`streamingGenerationProgress_${id}`, data),
    );
    return true;
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin])
  @Mutation(() => VideoEntity)
  async createVideo({ originalMediaId }: CreateVideoInput) {
    return this.videoService.create({ originalMediaId });
  }

  @Query(() => PaginatedVideos)
  async getVideos(@Args() { sort, filter, ...pagination }: GetVideosArgs) {
    const [data, count] = await Promise.all([
      this.videoService.readMany(pagination, sort, filter),
      this.videoService.count(filter),
    ]);

    const { limit, offset } = pagination;

    return {
      nodes: data,
      pageInfo: {
        totalCount: count,
        hasNextPage: count > limit + offset,
        hasPreviousPage: offset > 0,
      },
    };
  }

  @Query(() => VideoEntity)
  getVideo(@Args('id', { type: () => Int }) id: number) {
    return this.videoService.readOne(id);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => VideoEntity)
  removeVideo(@Args('id', { type: () => Int }) id: number) {
    return this.videoService.delete(id);
  }

  @Subscription(() => StreamingGenerationProgressDto, {
    resolve: (value: StreamingGenerationProgressDto, { id }) => ({
      ...value,
      message: `video-${id}: ${value.message}`,
    }),
  })
  streamingGenerationProgress(@Args('id', { type: () => Int }) id: number) {
    return this.pubSub.asyncIterableIterator<StreamingGenerationProgressDto>(
      `streamingGenerationProgress_${id}`,
    );
  }

  @ResolveField(() => MediaEntity, { nullable: true })
  originalMedia(
    @Parent() video: VideoEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return video.originalMediaId
      ? loadersFactory
          .createOrGetLoader(MediaEntity, 'id')
          .load(video.originalMediaId)
      : undefined;
  }

  @ResolveField(() => MediaEntity, { nullable: true })
  dashManifestMedia(
    @Parent() video: VideoEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return video.dashManifestMediaId
      ? loadersFactory
          .createOrGetLoader(MediaEntity, 'id')
          .load(video.dashManifestMediaId)
      : undefined;
  }

  @ResolveField(() => [VideoVariantEntity])
  variants(
    @Parent() video: VideoEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(VideoVariantEntity, 'videoId', VideoEntity, 'id')
      .load({ id: video.id });
  }

  @ResolveField(() => [VideoAudioEntity])
  audios(
    @Parent() video: VideoEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(VideoAudioEntity, 'videoId', VideoEntity, 'id')
      .load({ id: video.id });
  }

  @ResolveField(() => [SubtitlesEntity])
  subtitles(
    @Parent() video: VideoEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(SubtitlesEntity, 'videoId', VideoEntity, 'id')
      .load({ id: video.id });
  }
}
