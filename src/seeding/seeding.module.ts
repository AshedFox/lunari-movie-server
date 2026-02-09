import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingService } from './seeding.service';
import { CountryEntity } from '../country/entities/country.entity';
import { GenreEntity } from '../genre/entities/genre.entity';
import { CurrencyEntity } from '../currency/entities/currency.entity';
import { LanguageEntity } from '../language/entities/language.entity';
import { MovieImageTypeEntity } from '../movie-image-type/entities/movie-image-type.entity';
import { MoviePersonTypeEntity } from '../movie-person-type/entities/movie-person-type.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmConfig } from '../config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    TypeOrmModule.forFeature([
      CountryEntity,
      GenreEntity,
      CurrencyEntity,
      LanguageEntity,
      MovieImageTypeEntity,
      MoviePersonTypeEntity,
    ]),
  ],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}
