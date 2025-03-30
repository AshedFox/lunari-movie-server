import {
  Args,
  Int,
  Mutation,
  ResolveField,
  Resolver,
  Root,
  Subscription,
} from '@nestjs/graphql';
import { VideoAudioService } from './video-audio.service';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@utils/enums';
import { GenerateVideoAudiosInput } from './dto/generate-video-audios.input';
import { PubSub } from 'graphql-subscriptions';
import { VideoEntity } from '../video/entities/video.entity';
import { LoadersFactory } from '../dataloader/decorators/loaders-factory.decorator';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { MediaEntity } from '../media/entities/media.entity';
import { LanguageEntity } from '../language/entities/language.entity';
import { VideoAudioEntity } from './entities/video-audio.entity';
import { AudioVariantsProgressDto } from './dto/audio-variants-progress.dto';

@Resolver(() => VideoAudioEntity)
export class VideoAudioResolver {
  constructor(
    private readonly videoAudioService: VideoAudioService,
    @Inject('PUB_SUB')
    private readonly pubSub: PubSub,
  ) {}

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => Boolean)
  async generateVideoAudios(
    @Args('input')
    input: GenerateVideoAudiosInput,
  ) {
    this.videoAudioService.generateVideoAudios(input, (data) =>
      this.pubSub.publish(`audioVariantsProgress_${input.videoId}`, data),
    );

    return true;
  }

  @ResolveField(() => VideoEntity)
  video(
    @Root() videoAudio: VideoAudioEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(VideoEntity, 'id')
      .load(videoAudio.videoId);
  }

  @ResolveField(() => MediaEntity)
  media(
    @Root() videoAudio: VideoAudioEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(MediaEntity, 'id')
      .load(videoAudio.mediaId);
  }

  @ResolveField(() => LanguageEntity)
  language(
    @Root() videoAudio: VideoAudioEntity,
    @LoadersFactory() loadersFactory: DataLoaderFactory,
  ) {
    return loadersFactory
      .createOrGetLoader(LanguageEntity, 'id')
      .load(videoAudio.languageId);
  }

  @Subscription(() => AudioVariantsProgressDto, {
    resolve: (value, { id }) => ({
      ...value,
      message: `video-${id}:audio: ${value.message}`,
    }),
  })
  audioVariantsProgress(@Args('id', { type: () => Int }) id: number) {
    return this.pubSub.asyncIterableIterator<AudioVariantsProgressDto>(
      `audioVariantsProgress_${id}`,
    );
  }
}
