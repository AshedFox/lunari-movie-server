import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1770651157089 implements MigrationInterface {
    name = 'Initial1770651157089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."media_type_enum" AS ENUM('VIDEO', 'IMAGE', 'RAW')`);
        await queryRunner.query(`CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."media_type_enum" NOT NULL, "url" character varying(4096) NOT NULL, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."videos_variants_profile_enum" AS ENUM('PROFILE_4k', 'PROFILE_2k', 'PROFILE_1080p', 'PROFILE_720p', 'PROFILE_480p', 'PROFILE_360p', 'PROFILE_240p', 'PROFILE_144p')`);
        await queryRunner.query(`CREATE TABLE "videos_variants" ("id" BIGSERIAL NOT NULL, "video_id" integer NOT NULL, "media_id" uuid NOT NULL, "profile" "public"."videos_variants_profile_enum" NOT NULL, CONSTRAINT "UQ_e255b0d4b05fd671009f9f63380" UNIQUE ("video_id", "profile"), CONSTRAINT "PK_4bb8db3cfd1497b4b452e790499" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "languages" ("id" character(3) NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "PK_b517f827ca496b29f4d549c631d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subtitles" ("id" BIGSERIAL NOT NULL, "video_id" integer NOT NULL, "language_id" character(3) NOT NULL, "file_id" uuid NOT NULL, CONSTRAINT "UQ_2f38b388c928fd03759e064034f" UNIQUE ("video_id", "language_id"), CONSTRAINT "PK_9ac397e12396227e34ba97af99e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."videos_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "videos" ("id" SERIAL NOT NULL, "status" "public"."videos_status_enum" NOT NULL DEFAULT 'PENDING', "original_media_id" uuid, "dash_manifest_media_id" uuid, CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."videos_audios_profile_enum" AS ENUM('ULTRA', 'HIGH', 'MEDIUM', 'LOW')`);
        await queryRunner.query(`CREATE TABLE "videos_audios" ("id" BIGSERIAL NOT NULL, "video_id" integer NOT NULL, "media_id" uuid NOT NULL, "language_id" character(3) NOT NULL, "profile" "public"."videos_audios_profile_enum" NOT NULL, CONSTRAINT "UQ_45153f44afd98ec9151f9378fe2" UNIQUE ("video_id", "language_id", "profile"), CONSTRAINT "PK_1e8941a8d35423a69e247dbe4be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "currencies" ("id" character(3) NOT NULL, "symbol" character varying(3) NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "PK_d528c54860c4182db13548e08c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "countries" ("id" character(2) NOT NULL, "name" character varying(255) NOT NULL, "currency_id" character(3) NOT NULL, "language_id" character(3) NOT NULL, CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dbc8b7c7ea68824c33bc3c1e6f" ON "countries" ("currency_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29aa6ca83c2f94df3cb765c35f" ON "countries" ("language_id") `);
        await queryRunner.query(`CREATE TABLE "movie_image_types" ("id" SMALLSERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_45b73fe3204e47b17e428c16f56" UNIQUE ("name"), CONSTRAINT "PK_844a018acb65501092bfa1005a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movies_images" ("id" BIGSERIAL NOT NULL, "type_id" smallint, "image_id" uuid NOT NULL, "movie_id" uuid NOT NULL, CONSTRAINT "PK_62e0b44867bc90aa6773f3d0926" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4c55d10bf7b5a5131bf2b42b50" ON "movies_images" ("type_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0923e8e9d34d4dbc400041f620" ON "movies_images" ("image_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5b6eaf321f310b2b20042c64c0" ON "movies_images" ("movie_id") `);
        await queryRunner.query(`CREATE TABLE "genres" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, CONSTRAINT "UQ_f105f8230a83b86a346427de94d" UNIQUE ("name"), CONSTRAINT "PK_80ecd718f0f00dde5d77a9be842" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movies_genres" ("genre_id" uuid NOT NULL, "movie_id" uuid NOT NULL, CONSTRAINT "PK_f880d4307800f050c252966573e" PRIMARY KEY ("genre_id", "movie_id"))`);
        await queryRunner.query(`CREATE TABLE "studios_countries" ("studio_id" integer NOT NULL, "country_id" character(2) NOT NULL, CONSTRAINT "PK_dcb06fcf6876b2e0b5b788ec8ae" PRIMARY KEY ("studio_id", "country_id"))`);
        await queryRunner.query(`CREATE TABLE "studios" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "PK_76ff398ef5041c4b42618ed6111" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_24cf90ec8130204b259c7ec9b6" ON "studios" ("name") `);
        await queryRunner.query(`CREATE TABLE "movies_studios" ("movie_id" uuid NOT NULL, "studio_id" integer NOT NULL, CONSTRAINT "PK_a4b3439ae544679dc4128731b0f" PRIMARY KEY ("movie_id", "studio_id"))`);
        await queryRunner.query(`CREATE TABLE "movie_person_types" ("id" SMALLSERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_87901e407c3c31ba3853aabebad" UNIQUE ("name"), CONSTRAINT "PK_0006dd1c6fc8df887608df023c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "persons" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "country_id" character(2), "image_id" uuid, CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8519aca9b2570008247aeb49f6" ON "persons" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_cace48c9270be80f6244dda63a" ON "persons" ("country_id") WHERE country_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_f236d9f8562a9b55740f086aa1" ON "persons" ("image_id") WHERE image_id IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "movies_persons" ("id" BIGSERIAL NOT NULL, "movie_id" uuid NOT NULL, "person_id" integer NOT NULL, "role" character varying(255), "type_id" smallint NOT NULL, CONSTRAINT "UQ_c7f0647920a4a838482b5bca6db" UNIQUE ("movie_id", "person_id", "type_id"), CONSTRAINT "PK_6a65f90523676a3d164292d6896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_daf5a8b2fca9f5dd19ef11ee9a" ON "movies_persons" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_38e74a666499622be28dad2ed4" ON "movies_persons" ("person_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3feb646e9402139790533c060" ON "movies_persons" ("type_id") `);
        await queryRunner.query(`CREATE TABLE "trailers" ("id" SERIAL NOT NULL, "title" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "movie_id" uuid NOT NULL, "video_id" integer NOT NULL, CONSTRAINT "UQ_b84ca772a4b0e48cb18c7eb641d" UNIQUE ("movie_id", "video_id"), CONSTRAINT "PK_598af6bec45fafbf70437f32b8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movies_visits" ("id" BIGSERIAL NOT NULL, "ip" character varying NOT NULL, "user_id" uuid, "movie_id" uuid NOT NULL, "visited_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76365d1590b4deda737d55e05f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4cf0b706ebbfd5e90f279a399f" ON "movies_visits" ("user_id") WHERE user_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7d43ba422a29773b8e8f4ef4a7" ON "movies_visits" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f46b002fc76c74a5cb8e724beb" ON "movies_visits" ("visited_at") `);
        await queryRunner.query(`CREATE TABLE "movies_reviews" ("id" BIGSERIAL NOT NULL, "user_id" uuid NOT NULL, "movie_id" uuid NOT NULL, "mark" smallint NOT NULL, "text" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c7c68c9aec849624f3ae7a4d575" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4b822560c0b0026358ac64bbed" ON "movies_reviews" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5b35e938ad0f0f016680f61f3b" ON "movies_reviews" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d4facb8260ff4890e6e68a9600" ON "movies_reviews" ("mark") `);
        await queryRunner.query(`CREATE INDEX "IDX_16c6cd914057f843cc9ff36a97" ON "movies_reviews" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "movies_countries" ("country_id" character(2) NOT NULL, "movie_id" uuid NOT NULL, CONSTRAINT "PK_7a5896b2b868b6edaf0a384cdaf" PRIMARY KEY ("country_id", "movie_id"))`);
        await queryRunner.query(`CREATE TABLE "collections_reviews" ("id" BIGSERIAL NOT NULL, "user_id" uuid NOT NULL, "collection_id" integer NOT NULL, "mark" smallint NOT NULL, "text" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eeaf6e409350a586cb04d4cbf1c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c28d95f0cb1f4d0cdc73223a5a" ON "collections_reviews" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d4e3ae5af35197dcf9fe308dd6" ON "collections_reviews" ("collection_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_96c90be5609148257916b69181" ON "collections_reviews" ("mark") `);
        await queryRunner.query(`CREATE INDEX "IDX_67636857d2a021e78713359fd5" ON "collections_reviews" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "collections" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "is_system" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" uuid NOT NULL, "cover_id" uuid, CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ed225078e8bf65b448b69105b4" ON "collections" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_734ae0606c12feb64e39dbcfe2" ON "collections" ("is_system") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9d69613bd2830d90dfce1e6be" ON "collections" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d2b698d97305ecf728a0fa763" ON "collections" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb83085d19d84a6fb93c6f56e5" ON "collections" ("cover_id") WHERE cover_id IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "collections_movies" ("collection_id" integer NOT NULL, "movie_id" uuid NOT NULL, CONSTRAINT "PK_2d048ab01910b91496a9439b52b" PRIMARY KEY ("collection_id", "movie_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."prices_interval_enum" AS ENUM('month', 'year')`);
        await queryRunner.query(`CREATE TABLE "prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "currency_id" character(3) NOT NULL, "amount" integer NOT NULL, "active" boolean NOT NULL DEFAULT true, "interval" "public"."prices_interval_enum", "stripe_price_id" character varying(255) NOT NULL, CONSTRAINT "UQ_f6fda7cdd493f9803d5173bb3eb" UNIQUE ("stripe_price_id"), CONSTRAINT "PK_2e40b9e4e631a53cd514d82ccd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products_prices" ("product_id" uuid NOT NULL, "price_id" uuid NOT NULL, CONSTRAINT "PK_1dc94eaae1c9bb3c51654f78e68" PRIMARY KEY ("product_id", "price_id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "active" boolean NOT NULL DEFAULT true, "movie_id" character varying NOT NULL, "stripe_product_id" character varying(255) NOT NULL, CONSTRAINT "UQ_830bc56e83cf6a76dd624291b1d" UNIQUE ("stripe_product_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."movies_type_enum" AS ENUM('film', 'series')`);
        await queryRunner.query(`CREATE TYPE "public"."movies_age_restriction_enum" AS ENUM('G', 'PG', 'PG-13', 'R', 'NC-17')`);
        await queryRunner.query(`CREATE TYPE "public"."movies_access_mode_enum" AS ENUM('PUBLIC', 'PRIVATE')`);
        await queryRunner.query(`CREATE TABLE "movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."movies_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "age_restriction" "public"."movies_age_restriction_enum" NOT NULL, "access_mode" "public"."movies_access_mode_enum" NOT NULL DEFAULT 'PRIVATE', "cover_id" uuid, "product_id" character varying(255), "start_release_date" TIMESTAMP, "end_release_date" TIMESTAMP, "release_date" TIMESTAMP, "video_id" integer, CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5aa0bbd146c0082d3fc5a0ad5d" ON "movies" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_86d4b11fb59a1594409c18ac1a" ON "movies" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_5b3c4a82950ac406e1b9299d45" ON "movies" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_74a36d28695a5930ec5f76dbb1" ON "movies" ("access_mode") WHERE access_mode = 'PUBLIC'`);
        await queryRunner.query(`CREATE INDEX "IDX_57dcaa9dd1a477299c88b345f1" ON "movies" ("cover_id") WHERE cover_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_d3b03ced14e605c9411e8e8883" ON "movies" ("start_release_date") WHERE start_release_date IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_fd2d7eca8b9076f1e5fb370d6f" ON "movies" ("end_release_date") WHERE end_release_date IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_e0b2e524f9a2fd66a061af998b" ON "movies" ("release_date") WHERE release_date IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_e9134f3388bbf566f1ddd02948" ON "movies" ("video_id") WHERE video_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_d53f6479e8a7ab516df7b7fdb0" ON "movies" ("type") `);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "made_at" TIMESTAMP NOT NULL, "price_id" uuid NOT NULL, "user_id" uuid NOT NULL, "movie_id" uuid NOT NULL, "stripe_payment_id" character varying(255) NOT NULL, CONSTRAINT "UQ_1ab385b81e6623c00951bdb5353" UNIQUE ("stripe_payment_id"), CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'past_due')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "period_start" TIMESTAMP NOT NULL, "period_end" TIMESTAMP NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL, "price_id" uuid NOT NULL, "user_id" uuid NOT NULL, "stripe_subscription_id" character varying(255) NOT NULL, CONSTRAINT "UQ_3a2d09d943f39912a01831a9272" UNIQUE ("stripe_subscription_id"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rooms_participants" ("room_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_fded5393dfa54bac6dbd18dbc0c" PRIMARY KEY ("room_id", "user_id"))`);
        await queryRunner.query(`CREATE TABLE "rooms_movies" ("movie_id" uuid NOT NULL, "room_id" uuid NOT NULL, "episode_number" integer, "order" smallint NOT NULL, "show_start" TIMESTAMP, CONSTRAINT "UQ_2eaf1f6b4b4cbaa4b2c175601fd" UNIQUE ("room_id", "order"), CONSTRAINT "PK_3d565225ad4e56faf7dc5b69ad3" PRIMARY KEY ("movie_id", "room_id"))`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "owner_id" uuid NOT NULL, CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_48b79438f8707f3d9ca83d85ea" ON "rooms" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f38c339cb7a6e33b02f9d2c74" ON "rooms" ("owner_id") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'moderator', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(320) NOT NULL, "is_email_confirmed" boolean NOT NULL DEFAULT false, "password" character varying NOT NULL, "name" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "country_id" character(2), "customer_id" character varying(255), "avatar_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dec24ffc6d5897cb4dfbbaa30e" ON "users" ("is_email_confirmed") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9b5b525a96ddc2c5647d7f7fa" ON "users" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d596d799f9cb9dac6f7bf7c23" ON "users" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cb50d25d9ca0df9fb4766dc3e" ON "users" ("country_id") WHERE country_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_15067801091aae0e2c0da44a02" ON "users" ("avatar_id") WHERE avatar_id IS NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."episodes_age_restriction_enum" AS ENUM('G', 'PG', 'PG-13', 'R', 'NC-17')`);
        await queryRunner.query(`CREATE TYPE "public"."episodes_access_mode_enum" AS ENUM('PUBLIC', 'PRIVATE')`);
        await queryRunner.query(`CREATE TABLE "episodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255), "description" text, "age_restriction" "public"."episodes_age_restriction_enum" NOT NULL, "release_date" TIMESTAMP, "publication_date" TIMESTAMP NOT NULL DEFAULT now(), "cover_id" uuid, "access_mode" "public"."episodes_access_mode_enum" NOT NULL DEFAULT 'PRIVATE', "number_in_series" smallint NOT NULL, "number_in_season" smallint NOT NULL, "season_id" uuid NOT NULL, "series_id" uuid NOT NULL, "video_id" integer, CONSTRAINT "UQ_68c42f40f162f365354650705d2" UNIQUE ("number_in_season", "season_id"), CONSTRAINT "UQ_06b0a3a35bc275bb8c6ecb4fde9" UNIQUE ("number_in_series", "series_id"), CONSTRAINT "PK_6a003fda8b0473fffc39cb831c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_270c7e6a3b6f09cbec5821751e" ON "episodes" ("release_date") WHERE release_date IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_e91c6205995d83de654f8bdf0d" ON "episodes" ("cover_id") WHERE cover_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ad7f5e629bd4e99727e4024ad8" ON "episodes" ("access_mode") WHERE access_mode = 'PUBLIC'`);
        await queryRunner.query(`CREATE INDEX "IDX_8fc013f436d72d36ab6a5af746" ON "episodes" ("season_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_624166580dfcd4e2d88a978ce7" ON "episodes" ("series_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b45a29b8404cf600a2a673a546" ON "episodes" ("video_id") WHERE video_id IS NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."seasons_age_restriction_enum" AS ENUM('G', 'PG', 'PG-13', 'R', 'NC-17')`);
        await queryRunner.query(`CREATE TYPE "public"."seasons_access_mode_enum" AS ENUM('PUBLIC', 'PRIVATE')`);
        await queryRunner.query(`CREATE TABLE "seasons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number_in_series" smallint NOT NULL, "title" character varying(255), "description" text, "age_restriction" "public"."seasons_age_restriction_enum" NOT NULL, "start_release_date" TIMESTAMP, "end_release_date" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "access_mode" "public"."seasons_access_mode_enum" NOT NULL DEFAULT 'PRIVATE', "series_id" uuid NOT NULL, CONSTRAINT "UQ_7cb3deb17817ccedb9669e4b337" UNIQUE ("number_in_series", "series_id"), CONSTRAINT "PK_cb8ed53b5fe109dcd4a4449ec9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2cc9574a2b8b468fc5ce0da634" ON "seasons" ("start_release_date") WHERE start_release_date IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_f7b2c92daf3bf5404d99bf5ccf" ON "seasons" ("end_release_date") WHERE end_release_date IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_c20d43c9998b4936291054cebc" ON "seasons" ("access_mode") WHERE access_mode = 'PUBLIC'`);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "active" boolean NOT NULL DEFAULT true, "stripe_product_id" character varying(255) NOT NULL, CONSTRAINT "UQ_6e61112f9e80c7d419d85ca93dc" UNIQUE ("stripe_product_id"), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plans_prices" ("plan_id" uuid NOT NULL, "price_id" uuid NOT NULL, CONSTRAINT "PK_1504cd2902ee1cfcd04085add3b" PRIMARY KEY ("plan_id", "price_id"))`);
        await queryRunner.query(`CREATE TABLE "movies_users" ("user_id" uuid NOT NULL, "movie_id" uuid NOT NULL, "is_watched" boolean NOT NULL DEFAULT false, "is_bookmarked" boolean NOT NULL DEFAULT false, "is_favorite" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_29c7a0ec73db14e39714a7c623b" PRIMARY KEY ("user_id", "movie_id"))`);
        await queryRunner.query(`CREATE TABLE "collections_users" ("user_id" uuid NOT NULL, "collection_id" integer NOT NULL, "is_watched" boolean NOT NULL DEFAULT false, "is_bookmarked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_cfc4970dba215699eda2f130ba7" PRIMARY KEY ("user_id", "collection_id"))`);
        await queryRunner.query(`ALTER TABLE "videos_variants" ADD CONSTRAINT "FK_3efb8d5f1255ca52fa5bf2b9e81" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "videos_variants" ADD CONSTRAINT "FK_f9863bcd43cafa5b122454ee130" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "subtitles" ADD CONSTRAINT "FK_a939828345a22a5177a0c192a42" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subtitles" ADD CONSTRAINT "FK_a6ba144fbf0a90a6152641f2cc5" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subtitles" ADD CONSTRAINT "FK_daa9e32acf7c742a25ff22b1a63" FOREIGN KEY ("file_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "videos" ADD CONSTRAINT "FK_6d95db988b825a8931077ba5d39" FOREIGN KEY ("original_media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "videos" ADD CONSTRAINT "FK_c02c87691dc57f7537239918245" FOREIGN KEY ("dash_manifest_media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "videos_audios" ADD CONSTRAINT "FK_baf7e3371f2c0336a0ad69aaf5f" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "videos_audios" ADD CONSTRAINT "FK_68f05b43beac69ecdff6691329f" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "videos_audios" ADD CONSTRAINT "FK_58ca3583b531e723a201eada682" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "countries" ADD CONSTRAINT "FK_dbc8b7c7ea68824c33bc3c1e6f4" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "countries" ADD CONSTRAINT "FK_29aa6ca83c2f94df3cb765c35f1" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_images" ADD CONSTRAINT "FK_4c55d10bf7b5a5131bf2b42b506" FOREIGN KEY ("type_id") REFERENCES "movie_image_types"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_images" ADD CONSTRAINT "FK_0923e8e9d34d4dbc400041f6201" FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_images" ADD CONSTRAINT "FK_5b6eaf321f310b2b20042c64c03" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_genres" ADD CONSTRAINT "FK_ef4fe5a96b6f83e9472bdaefbc5" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_genres" ADD CONSTRAINT "FK_4729d9b8d47986f936cb5e9540e" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "studios_countries" ADD CONSTRAINT "FK_94f7d1d5e77c9a1eaf1defd324a" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "studios_countries" ADD CONSTRAINT "FK_a73e12c3d56feb0e4fcea2ff11f" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_studios" ADD CONSTRAINT "FK_53f72f34036e23aeb1a06e37aed" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_studios" ADD CONSTRAINT "FK_6ef96ca6af7d30ce28fcae730bc" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "persons" ADD CONSTRAINT "FK_b4a84ca5a0efbd6d25c46e33ae6" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "persons" ADD CONSTRAINT "FK_1ed6df6ac783be61b8386763e33" FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_persons" ADD CONSTRAINT "FK_daf5a8b2fca9f5dd19ef11ee9a0" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_persons" ADD CONSTRAINT "FK_38e74a666499622be28dad2ed49" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_persons" ADD CONSTRAINT "FK_f3feb646e9402139790533c060d" FOREIGN KEY ("type_id") REFERENCES "movie_person_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "trailers" ADD CONSTRAINT "FK_ab79e53d411f0c8acdd580b9b47" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "trailers" ADD CONSTRAINT "FK_8b7410936924b48b7a382e31d2b" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_visits" ADD CONSTRAINT "FK_7b5e6616ec53874852d0f0e0c20" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_visits" ADD CONSTRAINT "FK_7d43ba422a29773b8e8f4ef4a7c" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_reviews" ADD CONSTRAINT "FK_4b822560c0b0026358ac64bbed4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_reviews" ADD CONSTRAINT "FK_5b35e938ad0f0f016680f61f3b3" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_countries" ADD CONSTRAINT "FK_c0db25fb12aec0b9cec74fc8423" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_countries" ADD CONSTRAINT "FK_291fda6c54d1e72412cc0b94bb4" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections_reviews" ADD CONSTRAINT "FK_c28d95f0cb1f4d0cdc73223a5a1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections_reviews" ADD CONSTRAINT "FK_d4e3ae5af35197dcf9fe308dd67" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections" ADD CONSTRAINT "FK_d910810b3fbbd3745a925bcd6c6" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections" ADD CONSTRAINT "FK_5bee18f8c9601eebd1fb1fdc0e4" FOREIGN KEY ("cover_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections_movies" ADD CONSTRAINT "FK_4f3c44f04006b40f2ee0157f07e" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections_movies" ADD CONSTRAINT "FK_01d5461122814de0d3639cd6fcc" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "prices" ADD CONSTRAINT "FK_efccf450fbef16adea889a07742" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "products_prices" ADD CONSTRAINT "FK_697e2ab9352cc2f783b3b27de92" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products_prices" ADD CONSTRAINT "FK_3493cfee6c4c1a17ac8fa148fb4" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "FK_247c73ac0f9f98854738dea6b7b" FOREIGN KEY ("cover_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_86c4ac20aef07c851474e167f58" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_024ddf7e04177a07fcb9806a90a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_4ca9a0cf252fb114b8dd68444c4" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7f7fe1f6132e48683387c32982c" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rooms_participants" ADD CONSTRAINT "FK_36b291fc6ec379fadb0e85fa063" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rooms_participants" ADD CONSTRAINT "FK_c77cb02acfce53a2ec2576a088e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rooms_movies" ADD CONSTRAINT "FK_1556fe5c9a35ea896c2d1c2a93b" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rooms_movies" ADD CONSTRAINT "FK_28fba1f469489e3d5d8a267befb" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rooms" ADD CONSTRAINT "FK_9f38c339cb7a6e33b02f9d2c743" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_ae78dc6cb10aa14cfef96b2dd90" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c3401836efedec3bec459c8f818" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "episodes" ADD CONSTRAINT "FK_37f40b7a00482bb9bb79460d696" FOREIGN KEY ("cover_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "episodes" ADD CONSTRAINT "FK_8fc013f436d72d36ab6a5af746f" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "episodes" ADD CONSTRAINT "FK_624166580dfcd4e2d88a978ce71" FOREIGN KEY ("series_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD CONSTRAINT "FK_c5d98a37f5d9e20dcd4196c04a8" FOREIGN KEY ("series_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "plans_prices" ADD CONSTRAINT "FK_6e4d3c03171e1feac3a3b0b1c7d" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plans_prices" ADD CONSTRAINT "FK_a440b636a1e17e64ca9588b116c" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movies_users" ADD CONSTRAINT "FK_3682f26c701421276529a6cb24f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movies_users" ADD CONSTRAINT "FK_abc9403a694dd745359de5daaec" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections_users" ADD CONSTRAINT "FK_dc045ddf9ed1ee725150dfd42e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collections_users" ADD CONSTRAINT "FK_4444b3819460fa29f55b9690c9b" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`CREATE MATERIALIZED VIEW "movies_stats" AS 
    WITH visits AS (
        SELECT 
            movie_id, 
            SUM(EXP(-0.02 * EXTRACT(DAY FROM NOW() - visited_at))) AS decayed_visits
        FROM movies_visits
        GROUP BY movie_id
    ),
    reviews AS (
        SELECT 
            movie_id, 
            COUNT(id) AS reviews
        FROM movies_reviews
        GROUP BY movie_id
    ),
    bookmarks AS (
        SELECT 
            movie_id, 
            COUNT(user_id) AS bookmarks
        FROM movies_users
        WHERE is_bookmarked = TRUE
        GROUP BY movie_id
    )
    SELECT 
        m.id as movie_id, 
        COALESCE(v.decayed_visits, 0)::DOUBLE PRECISION AS visits_count,
        COALESCE(r.reviews, 0) AS reviews_count,
        COALESCE(b.bookmarks, 0) AS bookmarks_count,
        (0.4 * LOG(1 + COALESCE(v.decayed_visits::DOUBLE PRECISION/10000, 0)) + 
        0.3 * LOG(1 + COALESCE(r.reviews::DOUBLE PRECISION/100, 0)) + 
        0.35 * LOG(1 + COALESCE(b.bookmarks::DOUBLE PRECISION/50, 0)))::DOUBLE PRECISION AS popularity_score
    FROM movies m
    LEFT JOIN visits v ON m.id = v.movie_id
    LEFT JOIN reviews r ON m.id = r.movie_id
    LEFT JOIN bookmarks b ON m.id = b.movie_id
    ORDER BY popularity_score DESC;
  `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","MATERIALIZED_VIEW","movies_stats","WITH visits AS (\n        SELECT \n            movie_id, \n            SUM(EXP(-0.02 * EXTRACT(DAY FROM NOW() - visited_at))) AS decayed_visits\n        FROM movies_visits\n        GROUP BY movie_id\n    ),\n    reviews AS (\n        SELECT \n            movie_id, \n            COUNT(id) AS reviews\n        FROM movies_reviews\n        GROUP BY movie_id\n    ),\n    bookmarks AS (\n        SELECT \n            movie_id, \n            COUNT(user_id) AS bookmarks\n        FROM movies_users\n        WHERE is_bookmarked = TRUE\n        GROUP BY movie_id\n    )\n    SELECT \n        m.id as movie_id, \n        COALESCE(v.decayed_visits, 0)::DOUBLE PRECISION AS visits_count,\n        COALESCE(r.reviews, 0) AS reviews_count,\n        COALESCE(b.bookmarks, 0) AS bookmarks_count,\n        (0.4 * LOG(1 + COALESCE(v.decayed_visits::DOUBLE PRECISION/10000, 0)) + \n        0.3 * LOG(1 + COALESCE(r.reviews::DOUBLE PRECISION/100, 0)) + \n        0.35 * LOG(1 + COALESCE(b.bookmarks::DOUBLE PRECISION/50, 0)))::DOUBLE PRECISION AS popularity_score\n    FROM movies m\n    LEFT JOIN visits v ON m.id = v.movie_id\n    LEFT JOIN reviews r ON m.id = r.movie_id\n    LEFT JOIN bookmarks b ON m.id = b.movie_id\n    ORDER BY popularity_score DESC;"]);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dea382eafcdc54a16e8e37e235" ON "movies_stats" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c7cace4da3db52cc3d4141848c" ON "movies_stats" ("popularity_score") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c7cace4da3db52cc3d4141848c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dea382eafcdc54a16e8e37e235"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["MATERIALIZED_VIEW","movies_stats","public"]);
        await queryRunner.query(`DROP MATERIALIZED VIEW "movies_stats"`);
        await queryRunner.query(`ALTER TABLE "collections_users" DROP CONSTRAINT "FK_4444b3819460fa29f55b9690c9b"`);
        await queryRunner.query(`ALTER TABLE "collections_users" DROP CONSTRAINT "FK_dc045ddf9ed1ee725150dfd42e8"`);
        await queryRunner.query(`ALTER TABLE "movies_users" DROP CONSTRAINT "FK_abc9403a694dd745359de5daaec"`);
        await queryRunner.query(`ALTER TABLE "movies_users" DROP CONSTRAINT "FK_3682f26c701421276529a6cb24f"`);
        await queryRunner.query(`ALTER TABLE "plans_prices" DROP CONSTRAINT "FK_a440b636a1e17e64ca9588b116c"`);
        await queryRunner.query(`ALTER TABLE "plans_prices" DROP CONSTRAINT "FK_6e4d3c03171e1feac3a3b0b1c7d"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP CONSTRAINT "FK_c5d98a37f5d9e20dcd4196c04a8"`);
        await queryRunner.query(`ALTER TABLE "episodes" DROP CONSTRAINT "FK_624166580dfcd4e2d88a978ce71"`);
        await queryRunner.query(`ALTER TABLE "episodes" DROP CONSTRAINT "FK_8fc013f436d72d36ab6a5af746f"`);
        await queryRunner.query(`ALTER TABLE "episodes" DROP CONSTRAINT "FK_37f40b7a00482bb9bb79460d696"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c3401836efedec3bec459c8f818"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_ae78dc6cb10aa14cfef96b2dd90"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT "FK_9f38c339cb7a6e33b02f9d2c743"`);
        await queryRunner.query(`ALTER TABLE "rooms_movies" DROP CONSTRAINT "FK_28fba1f469489e3d5d8a267befb"`);
        await queryRunner.query(`ALTER TABLE "rooms_movies" DROP CONSTRAINT "FK_1556fe5c9a35ea896c2d1c2a93b"`);
        await queryRunner.query(`ALTER TABLE "rooms_participants" DROP CONSTRAINT "FK_c77cb02acfce53a2ec2576a088e"`);
        await queryRunner.query(`ALTER TABLE "rooms_participants" DROP CONSTRAINT "FK_36b291fc6ec379fadb0e85fa063"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7f7fe1f6132e48683387c32982c"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_4ca9a0cf252fb114b8dd68444c4"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_024ddf7e04177a07fcb9806a90a"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_86c4ac20aef07c851474e167f58"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "FK_247c73ac0f9f98854738dea6b7b"`);
        await queryRunner.query(`ALTER TABLE "products_prices" DROP CONSTRAINT "FK_3493cfee6c4c1a17ac8fa148fb4"`);
        await queryRunner.query(`ALTER TABLE "products_prices" DROP CONSTRAINT "FK_697e2ab9352cc2f783b3b27de92"`);
        await queryRunner.query(`ALTER TABLE "prices" DROP CONSTRAINT "FK_efccf450fbef16adea889a07742"`);
        await queryRunner.query(`ALTER TABLE "collections_movies" DROP CONSTRAINT "FK_01d5461122814de0d3639cd6fcc"`);
        await queryRunner.query(`ALTER TABLE "collections_movies" DROP CONSTRAINT "FK_4f3c44f04006b40f2ee0157f07e"`);
        await queryRunner.query(`ALTER TABLE "collections" DROP CONSTRAINT "FK_5bee18f8c9601eebd1fb1fdc0e4"`);
        await queryRunner.query(`ALTER TABLE "collections" DROP CONSTRAINT "FK_d910810b3fbbd3745a925bcd6c6"`);
        await queryRunner.query(`ALTER TABLE "collections_reviews" DROP CONSTRAINT "FK_d4e3ae5af35197dcf9fe308dd67"`);
        await queryRunner.query(`ALTER TABLE "collections_reviews" DROP CONSTRAINT "FK_c28d95f0cb1f4d0cdc73223a5a1"`);
        await queryRunner.query(`ALTER TABLE "movies_countries" DROP CONSTRAINT "FK_291fda6c54d1e72412cc0b94bb4"`);
        await queryRunner.query(`ALTER TABLE "movies_countries" DROP CONSTRAINT "FK_c0db25fb12aec0b9cec74fc8423"`);
        await queryRunner.query(`ALTER TABLE "movies_reviews" DROP CONSTRAINT "FK_5b35e938ad0f0f016680f61f3b3"`);
        await queryRunner.query(`ALTER TABLE "movies_reviews" DROP CONSTRAINT "FK_4b822560c0b0026358ac64bbed4"`);
        await queryRunner.query(`ALTER TABLE "movies_visits" DROP CONSTRAINT "FK_7d43ba422a29773b8e8f4ef4a7c"`);
        await queryRunner.query(`ALTER TABLE "movies_visits" DROP CONSTRAINT "FK_7b5e6616ec53874852d0f0e0c20"`);
        await queryRunner.query(`ALTER TABLE "trailers" DROP CONSTRAINT "FK_8b7410936924b48b7a382e31d2b"`);
        await queryRunner.query(`ALTER TABLE "trailers" DROP CONSTRAINT "FK_ab79e53d411f0c8acdd580b9b47"`);
        await queryRunner.query(`ALTER TABLE "movies_persons" DROP CONSTRAINT "FK_f3feb646e9402139790533c060d"`);
        await queryRunner.query(`ALTER TABLE "movies_persons" DROP CONSTRAINT "FK_38e74a666499622be28dad2ed49"`);
        await queryRunner.query(`ALTER TABLE "movies_persons" DROP CONSTRAINT "FK_daf5a8b2fca9f5dd19ef11ee9a0"`);
        await queryRunner.query(`ALTER TABLE "persons" DROP CONSTRAINT "FK_1ed6df6ac783be61b8386763e33"`);
        await queryRunner.query(`ALTER TABLE "persons" DROP CONSTRAINT "FK_b4a84ca5a0efbd6d25c46e33ae6"`);
        await queryRunner.query(`ALTER TABLE "movies_studios" DROP CONSTRAINT "FK_6ef96ca6af7d30ce28fcae730bc"`);
        await queryRunner.query(`ALTER TABLE "movies_studios" DROP CONSTRAINT "FK_53f72f34036e23aeb1a06e37aed"`);
        await queryRunner.query(`ALTER TABLE "studios_countries" DROP CONSTRAINT "FK_a73e12c3d56feb0e4fcea2ff11f"`);
        await queryRunner.query(`ALTER TABLE "studios_countries" DROP CONSTRAINT "FK_94f7d1d5e77c9a1eaf1defd324a"`);
        await queryRunner.query(`ALTER TABLE "movies_genres" DROP CONSTRAINT "FK_4729d9b8d47986f936cb5e9540e"`);
        await queryRunner.query(`ALTER TABLE "movies_genres" DROP CONSTRAINT "FK_ef4fe5a96b6f83e9472bdaefbc5"`);
        await queryRunner.query(`ALTER TABLE "movies_images" DROP CONSTRAINT "FK_5b6eaf321f310b2b20042c64c03"`);
        await queryRunner.query(`ALTER TABLE "movies_images" DROP CONSTRAINT "FK_0923e8e9d34d4dbc400041f6201"`);
        await queryRunner.query(`ALTER TABLE "movies_images" DROP CONSTRAINT "FK_4c55d10bf7b5a5131bf2b42b506"`);
        await queryRunner.query(`ALTER TABLE "countries" DROP CONSTRAINT "FK_29aa6ca83c2f94df3cb765c35f1"`);
        await queryRunner.query(`ALTER TABLE "countries" DROP CONSTRAINT "FK_dbc8b7c7ea68824c33bc3c1e6f4"`);
        await queryRunner.query(`ALTER TABLE "videos_audios" DROP CONSTRAINT "FK_58ca3583b531e723a201eada682"`);
        await queryRunner.query(`ALTER TABLE "videos_audios" DROP CONSTRAINT "FK_68f05b43beac69ecdff6691329f"`);
        await queryRunner.query(`ALTER TABLE "videos_audios" DROP CONSTRAINT "FK_baf7e3371f2c0336a0ad69aaf5f"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP CONSTRAINT "FK_c02c87691dc57f7537239918245"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP CONSTRAINT "FK_6d95db988b825a8931077ba5d39"`);
        await queryRunner.query(`ALTER TABLE "subtitles" DROP CONSTRAINT "FK_daa9e32acf7c742a25ff22b1a63"`);
        await queryRunner.query(`ALTER TABLE "subtitles" DROP CONSTRAINT "FK_a6ba144fbf0a90a6152641f2cc5"`);
        await queryRunner.query(`ALTER TABLE "subtitles" DROP CONSTRAINT "FK_a939828345a22a5177a0c192a42"`);
        await queryRunner.query(`ALTER TABLE "videos_variants" DROP CONSTRAINT "FK_f9863bcd43cafa5b122454ee130"`);
        await queryRunner.query(`ALTER TABLE "videos_variants" DROP CONSTRAINT "FK_3efb8d5f1255ca52fa5bf2b9e81"`);
        await queryRunner.query(`DROP TABLE "collections_users"`);
        await queryRunner.query(`DROP TABLE "movies_users"`);
        await queryRunner.query(`DROP TABLE "plans_prices"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c20d43c9998b4936291054cebc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7b2c92daf3bf5404d99bf5ccf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2cc9574a2b8b468fc5ce0da634"`);
        await queryRunner.query(`DROP TABLE "seasons"`);
        await queryRunner.query(`DROP TYPE "public"."seasons_access_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."seasons_age_restriction_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b45a29b8404cf600a2a673a546"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_624166580dfcd4e2d88a978ce7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fc013f436d72d36ab6a5af746"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad7f5e629bd4e99727e4024ad8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e91c6205995d83de654f8bdf0d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_270c7e6a3b6f09cbec5821751e"`);
        await queryRunner.query(`DROP TABLE "episodes"`);
        await queryRunner.query(`DROP TYPE "public"."episodes_access_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."episodes_age_restriction_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15067801091aae0e2c0da44a02"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cb50d25d9ca0df9fb4766dc3e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d596d799f9cb9dac6f7bf7c23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9b5b525a96ddc2c5647d7f7fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dec24ffc6d5897cb4dfbbaa30e"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f38c339cb7a6e33b02f9d2c74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48b79438f8707f3d9ca83d85ea"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TABLE "rooms_movies"`);
        await queryRunner.query(`DROP TABLE "rooms_participants"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d53f6479e8a7ab516df7b7fdb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9134f3388bbf566f1ddd02948"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0b2e524f9a2fd66a061af998b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd2d7eca8b9076f1e5fb370d6f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3b03ced14e605c9411e8e8883"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57dcaa9dd1a477299c88b345f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74a36d28695a5930ec5f76dbb1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b3c4a82950ac406e1b9299d45"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86d4b11fb59a1594409c18ac1a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5aa0bbd146c0082d3fc5a0ad5d"`);
        await queryRunner.query(`DROP TABLE "movies"`);
        await queryRunner.query(`DROP TYPE "public"."movies_access_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movies_age_restriction_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movies_type_enum"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "products_prices"`);
        await queryRunner.query(`DROP TABLE "prices"`);
        await queryRunner.query(`DROP TYPE "public"."prices_interval_enum"`);
        await queryRunner.query(`DROP TABLE "collections_movies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb83085d19d84a6fb93c6f56e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d2b698d97305ecf728a0fa763"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9d69613bd2830d90dfce1e6be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_734ae0606c12feb64e39dbcfe2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed225078e8bf65b448b69105b4"`);
        await queryRunner.query(`DROP TABLE "collections"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67636857d2a021e78713359fd5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96c90be5609148257916b69181"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4e3ae5af35197dcf9fe308dd6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c28d95f0cb1f4d0cdc73223a5a"`);
        await queryRunner.query(`DROP TABLE "collections_reviews"`);
        await queryRunner.query(`DROP TABLE "movies_countries"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16c6cd914057f843cc9ff36a97"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4facb8260ff4890e6e68a9600"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b35e938ad0f0f016680f61f3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4b822560c0b0026358ac64bbed"`);
        await queryRunner.query(`DROP TABLE "movies_reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f46b002fc76c74a5cb8e724beb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d43ba422a29773b8e8f4ef4a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cf0b706ebbfd5e90f279a399f"`);
        await queryRunner.query(`DROP TABLE "movies_visits"`);
        await queryRunner.query(`DROP TABLE "trailers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3feb646e9402139790533c060"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_38e74a666499622be28dad2ed4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_daf5a8b2fca9f5dd19ef11ee9a"`);
        await queryRunner.query(`DROP TABLE "movies_persons"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f236d9f8562a9b55740f086aa1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cace48c9270be80f6244dda63a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8519aca9b2570008247aeb49f6"`);
        await queryRunner.query(`DROP TABLE "persons"`);
        await queryRunner.query(`DROP TABLE "movie_person_types"`);
        await queryRunner.query(`DROP TABLE "movies_studios"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24cf90ec8130204b259c7ec9b6"`);
        await queryRunner.query(`DROP TABLE "studios"`);
        await queryRunner.query(`DROP TABLE "studios_countries"`);
        await queryRunner.query(`DROP TABLE "movies_genres"`);
        await queryRunner.query(`DROP TABLE "genres"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b6eaf321f310b2b20042c64c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0923e8e9d34d4dbc400041f620"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c55d10bf7b5a5131bf2b42b50"`);
        await queryRunner.query(`DROP TABLE "movies_images"`);
        await queryRunner.query(`DROP TABLE "movie_image_types"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29aa6ca83c2f94df3cb765c35f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dbc8b7c7ea68824c33bc3c1e6f"`);
        await queryRunner.query(`DROP TABLE "countries"`);
        await queryRunner.query(`DROP TABLE "currencies"`);
        await queryRunner.query(`DROP TABLE "videos_audios"`);
        await queryRunner.query(`DROP TYPE "public"."videos_audios_profile_enum"`);
        await queryRunner.query(`DROP TABLE "videos"`);
        await queryRunner.query(`DROP TYPE "public"."videos_status_enum"`);
        await queryRunner.query(`DROP TABLE "subtitles"`);
        await queryRunner.query(`DROP TABLE "languages"`);
        await queryRunner.query(`DROP TABLE "videos_variants"`);
        await queryRunner.query(`DROP TYPE "public"."videos_variants_profile_enum"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TYPE "public"."media_type_enum"`);
    }

}
