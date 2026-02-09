import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    const currencies = [
      { id: 'USD', name: 'United States Dollar', symbol: '$' },
      { id: 'EUR', name: 'Euro', symbol: '€' },
      { id: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { id: 'GBP', name: 'British Pound', symbol: '£' },
      { id: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    ];

    const existingCurrencies = await this.currencyRepository.find({
      where: { id: In(currencies.map((c) => c.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existingCurrencies.map((c) => c.id));
    const newCurrencies = currencies.filter((c) => !existingIds.has(c.id));

    if (newCurrencies.length > 0) {
      await this.currencyRepository.save(newCurrencies);
      this.logger.log(`Seeded ${newCurrencies.length} currencies`);
    }
  }

  private async seedLanguages() {
    const languages = [
      { id: 'eng', name: 'English' },
      { id: 'rus', name: 'Russian' },
      { id: 'spa', name: 'Spanish' },
      { id: 'fra', name: 'French' },
      { id: 'deu', name: 'German' },
      { id: 'jpn', name: 'Japanese' },
    ];

    const existingLanguages = await this.languageRepository.find({
      where: { id: In(languages.map((l) => l.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existingLanguages.map((l) => l.id));
    const newLanguages = languages.filter((l) => !existingIds.has(l.id));

    if (newLanguages.length > 0) {
      await this.languageRepository.save(newLanguages);
      this.logger.log(`Seeded ${newLanguages.length} languages`);
    }
  }

  private async seedCountries() {
    const countries = [
      { id: 'US', name: 'United States', currencyId: 'USD', languageId: 'eng' },
      { id: 'RU', name: 'Russia', currencyId: 'RUB', languageId: 'rus' },
      {
        id: 'GB',
        name: 'United Kingdom',
        currencyId: 'GBP',
        languageId: 'eng',
      },
      { id: 'FR', name: 'France', currencyId: 'EUR', languageId: 'fra' },
      { id: 'DE', name: 'Germany', currencyId: 'EUR', languageId: 'deu' },
      { id: 'JP', name: 'Japan', currencyId: 'JPY', languageId: 'jpn' },
      { id: 'ES', name: 'Spain', currencyId: 'EUR', languageId: 'spa' },
    ];

    const existingCountries = await this.countryRepository.find({
      where: { id: In(countries.map((c) => c.id)) },
      select: { id: true },
    });
    const existingIds = new Set(existingCountries.map((c) => c.id));
    const newCountries = countries.filter((c) => !existingIds.has(c.id));

    if (newCountries.length > 0) {
      await this.countryRepository.save(newCountries);
      this.logger.log(`Seeded ${newCountries.length} countries`);
    }
  }

  private async seedGenres() {
    const genres = [
      'Action',
      'Adventure',
      'Animation',
      'Comedy',
      'Crime',
      'Documentary',
      'Drama',
      'Family',
      'Fantasy',
      'History',
      'Horror',
      'Music',
      'Mystery',
      'Romance',
      'Science Fiction',
      'TV Movie',
      'Thriller',
      'War',
      'Western',
    ];

    const existingGenres = await this.genreRepository.find({
      where: { name: In(genres) },
      select: { name: true },
    });
    const existingNames = new Set(existingGenres.map((g) => g.name));
    const newGenres = genres
      .filter((name) => !existingNames.has(name))
      .map((name) => ({ name }));

    if (newGenres.length > 0) {
      await this.genreRepository.save(newGenres);
      this.logger.log(`Seeded ${newGenres.length} genres`);
    }
  }

  private async seedMovieImageTypes() {
    const types = ['poster', 'frame', 'promo'];

    const existingTypes = await this.movieImageTypeRepository.find({
      where: { name: In(types) },
      select: { name: true },
    });
    const existingNames = new Set(existingTypes.map((t) => t.name));
    const newTypes = types
      .filter((name) => !existingNames.has(name))
      .map((name) => ({ name }));

    if (newTypes.length > 0) {
      await this.movieImageTypeRepository.save(newTypes);
      this.logger.log(`Seeded ${newTypes.length} movie image types`);
    }
  }

  private async seedMoviePersonTypes() {
    const types = [
      'actor',
      'composer',
      'designer',
      'director',
      'editor',
      'operator',
      'producer',
      'screenwriter',
      'voice actor',
      'sound director',
      'music editor',
      'understudy',
      'casting director',
    ];

    const existingTypes = await this.moviePersonTypeRepository.find({
      where: { name: In(types) },
      select: { name: true },
    });
    const existingNames = new Set(existingTypes.map((t) => t.name));
    const newTypes = types
      .filter((name) => !existingNames.has(name))
      .map((name) => ({ name }));

    if (newTypes.length > 0) {
      await this.moviePersonTypeRepository.save(newTypes);
      this.logger.log(`Seeded ${newTypes.length} movie person types`);
    }
  }
}
