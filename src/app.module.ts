import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FilmModule } from './film/film.module';
import { UserModule } from './user/user.module';
import { EpisodeModule } from './episode/episode.module';
import { SeasonModule } from './season/season.module';
import { SeriesModule } from './series/series.module';
import { GenreModule } from './genre/genre.module';
import { PersonModule } from './person/person.module';
import { StudioModule } from './studio/studio.module';
import { MoviePersonModule } from './movie-person/movie-person.module';
import { AuthModule } from './auth/auth.module';
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module';
import { DataLoaderModule } from './dataloader/data-loader.module';
import { DataLoaderFactory } from './dataloader/data-loader.factory';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CustomThrottlerGuard } from '@utils/custom-throttler.guard';
import { ErrorInterceptor } from '@utils/error.interceptor';
import { MediaModule } from './media/media.module';
import { CountryModule } from './country/country.module';
import { StudioCountryModule } from './studio-country/studio-country.module';
import { MovieGenreModule } from './movie-genre/movie-genre.module';
import { MovieStudioModule } from './movie-studio/movie-studio.module';
import { MovieImageModule } from './movie-image/movie-image.module';
import { MovieModule } from './movie/movie.module';
import { TrailerModule } from './trailer/trailer.module';
import { MovieReviewModule } from './movie-review/movie-review.module';
import { MovieUserModule } from './movie-user/movie-user.module';
import { MovieCountryModule } from './movie-country/movie-country.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectionModule } from './collection/collection.module';
import { CollectionMovieModule } from './collection-movie/collection-movie.module';
import { MovieImageTypeModule } from './movie-image-type/movie-image-type.module';
import { MoviePersonTypeModule } from './movie-person-type/movie-person-type.module';
import { CurrencyModule } from './currency/currency.module';
import { RoomParticipantModule } from './room-participant/room-participant.module';
import { RoomModule } from './room/room.module';
import { LanguageModule } from './language/language.module';
import { VideoModule } from './video/video.module';
import { SubtitlesModule } from './subtitles/subtitles.module';
import { VideoVariantModule } from './video-variant/video-variant.module';
import { CaslModule } from './casl/casl.module';
import { GraphQLConfig } from './config/graphql.config';
import { TypeOrmConfig } from './config/typeorm.config';
import { ThrottlerConfig } from './config/throttler.config';
import { VideoAudioModule } from './video-audio/video-audio.module';
import { PurchaseModule } from './purchase/purchase.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PriceModule } from './price/price.module';
import { ProductPriceModule } from './product-price/product-price.module';
import { ProductModule } from './product/product.module';
import { CollectionReviewModule } from './collection-review/collection-review.module';
import { CollectionUserModule } from './collection-user/collection-user.module';
import { RoomMovieModule } from './room-movie/room-movie.module';
import { PlanModule } from './plan/plan.module';
import { PlanPriceModule } from './plan-price/plan-price.module';
import { StripeModule } from './stripe/stripe.module';
import { WebhookModule } from './webhook/webhook.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataLoaderModule],
      inject: [DataLoaderFactory],
      useClass: GraphQLConfig,
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.getOrThrow<string>('REDIS_URL'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      useClass: ThrottlerConfig,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CollectionModule,
    CollectionMovieModule,
    CollectionReviewModule,
    CollectionUserModule,
    CountryModule,
    DataLoaderModule,
    EmailConfirmationModule,
    EpisodeModule,
    FilmModule,
    GenreModule,
    MediaModule,
    MovieCountryModule,
    MovieGenreModule,
    MovieImageModule,
    MovieModule,
    MoviePersonModule,
    MovieStudioModule,
    PersonModule,
    MovieReviewModule,
    SeasonModule,
    SeriesModule,
    StudioCountryModule,
    StudioModule,
    TrailerModule,
    UserModule,
    VideoModule,
    LanguageModule,
    MovieUserModule,
    MovieImageTypeModule,
    MoviePersonTypeModule,
    CurrencyModule,
    RoomModule,
    RoomParticipantModule,
    RoomMovieModule,
    VideoVariantModule,
    SubtitlesModule,
    PlanPriceModule,
    ProductPriceModule,
    PurchaseModule,
    SubscriptionModule,
    PlanModule,
    PriceModule,
    ProductModule,
    CaslModule,
    VideoAudioModule,
    StripeModule,
    WebhookModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_PIPE, useClass: ValidationPipe },
  ],
})
export class AppModule {}
