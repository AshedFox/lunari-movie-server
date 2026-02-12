import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import {
  COUNTRIES,
  CURRENCIES,
  GENRES,
  LANGUAGES,
  MOVIE_IMAGE_TYPES,
  MOVIE_PERSON_TYPES,
} from './seed.data';
import { CountryEntity } from '../country/entities/country.entity';
import { GenreEntity } from '../genre/entities/genre.entity';
import { CurrencyEntity } from '../currency/entities/currency.entity';
import { LanguageEntity } from '../language/entities/language.entity';
import { MovieImageTypeEntity } from '../movie-image-type/entities/movie-image-type.entity';
import { MoviePersonTypeEntity } from '../movie-person-type/entities/movie-person-type.entity';

@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    @InjectRepository(CountryEntity)
    private readonly countryRepository: Repository<CountryEntity>,
    @InjectRepository(GenreEntity)
    private readonly genreRepository: Repository<GenreEntity>,
    @InjectRepository(CurrencyEntity)
    private readonly currencyRepository: Repository<CurrencyEntity>,
    @InjectRepository(LanguageEntity)
    private readonly languageRepository: Repository<LanguageEntity>,
    @InjectRepository(MovieImageTypeEntity)
    private readonly movieImageTypeRepository: Repository<MovieImageTypeEntity>,
    @InjectRepository(MoviePersonTypeEntity)
    private readonly moviePersonTypeRepository: Repository<MoviePersonTypeEntity>,
  ) {}

  async seed() {
    await this.seedCurrencies();
    await this.seedLanguages();
    await this.seedCountries();
    await this.seedGenres();
    await this.seedMovieImageTypes();
    await this.seedMoviePersonTypes();
  }

  private async seedCurrencies() {
    const existingCurrencies = await this.currencyRepository.find({
      where: { id: In(CURRENCIES.map((c) => c.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existingCurrencies.map((c) => c.id));
    const newCurrencies = CURRENCIES.filter((c) => !existingIds.has(c.id));

    if (newCurrencies.length > 0) {
      await this.currencyRepository.save(newCurrencies);
      this.logger.log(`Seeded ${newCurrencies.length} currencies`);
    }
  }

  private async seedLanguages() {
    const existingLanguages = await this.languageRepository.find({
      where: { id: In(LANGUAGES.map((l) => l.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existingLanguages.map((l) => l.id));
    const newLanguages = LANGUAGES.filter((l) => !existingIds.has(l.id));

    if (newLanguages.length > 0) {
      await this.languageRepository.save(newLanguages);
      this.logger.log(`Seeded ${newLanguages.length} languages`);
    }
  }

  private async seedCountries() {
    const existingCountries = await this.countryRepository.find({
      where: { id: In(COUNTRIES.map((c) => c.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existingCountries.map((c) => c.id));
    const newCountries = COUNTRIES.filter((c) => !existingIds.has(c.id));

    if (newCountries.length > 0) {
      await this.countryRepository.save(newCountries);
      this.logger.log(`Seeded ${newCountries.length} countries`);
    }
  }

  private async seedGenres() {
    const genreNames = GENRES.map((g) => g.name);
    const existingGenres = await this.genreRepository.find({
      where: { name: In(genreNames) },
      select: { name: true },
    });
    const existingNames = new Set(existingGenres.map((g) => g.name));
    const newGenres = GENRES.filter((g) => !existingNames.has(g.name));

    if (newGenres.length > 0) {
      await this.genreRepository.save(newGenres);
      this.logger.log(`Seeded ${newGenres.length} genres`);
    }
  }

  private async seedMovieImageTypes() {
    const typeNames = MOVIE_IMAGE_TYPES.map((t) => t.name);
    const existingTypes = await this.movieImageTypeRepository.find({
      where: { name: In(typeNames) },
      select: { name: true },
    });
    const existingNames = new Set(existingTypes.map((t) => t.name));
    const newTypes = MOVIE_IMAGE_TYPES.filter(
      (t) => !existingNames.has(t.name),
    );

    if (newTypes.length > 0) {
      await this.movieImageTypeRepository.save(newTypes);
      this.logger.log(`Seeded ${newTypes.length} movie image types`);
    }
  }

  private async seedMoviePersonTypes() {
    const typeNames = MOVIE_PERSON_TYPES.map((t) => t.name);
    const existingTypes = await this.moviePersonTypeRepository.find({
      where: { name: In(typeNames) },
      select: { name: true },
    });
    const existingNames = new Set(existingTypes.map((t) => t.name));
    const newTypes = MOVIE_PERSON_TYPES.filter(
      (t) => !existingNames.has(t.name),
    );

    if (newTypes.length > 0) {
      await this.moviePersonTypeRepository.save(newTypes);
      this.logger.log(`Seeded ${newTypes.length} movie person types`);
    }
  }
}
