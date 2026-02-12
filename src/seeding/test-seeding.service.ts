import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { UserEntity } from '../user/entities/user.entity';
import { MovieEntity } from '../movie/entities/movie.entity';
import { PersonEntity } from '../person/entities/person.entity';
import { StudioEntity } from '../studio/entities/studio.entity';
import { MovieReviewEntity } from '../movie-review/entities/movie-review.entity';
import { GenreEntity } from '../genre/entities/genre.entity';
import { CountryEntity } from '../country/entities/country.entity';
import { MediaEntity } from '../media/entities/media.entity';
import { MoviePersonEntity } from '../movie-person/entities/movie-person.entity';
import { FilmEntity } from '../film/entities/film.entity';
import { SeriesEntity } from '../series/entities/series.entity';
import { MovieTypeEnum } from '@utils/enums/movie-type.enum';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';

import {
  TEST_MEDIA_COVERS,
  TEST_MOVIES,
  TEST_PERSONS,
  TEST_REVIEWS,
  TEST_STUDIOS,
  TEST_USERS,
} from './test-seed.data';

@Injectable()
export class TestSeedingService {
  private readonly logger = new Logger(TestSeedingService.name);

  constructor(private readonly dataSource: DataSource) {}

  async seedTestData() {
    this.logger.log('Starting test data seeding...');

    try {
      await this.seedStudios();
      await this.seedPersons();
      await this.seedUsers();
      const mediaMap = await this.seedMedia();
      await this.seedMovies(mediaMap);
      await this.seedReviews();

      this.logger.log('Test data seeding completed successfully.');
    } catch (err) {
      this.logger.error('Seeding failed', err);
      throw err;
    }
  }

  private async seedMedia(): Promise<Map<string, MediaEntity>> {
    const allUrls = Object.values(TEST_MEDIA_COVERS);
    if (allUrls.length === 0) {
      return new Map();
    }

    const mediaRepo = this.dataSource.getRepository(MediaEntity);
    const uniqueUrls = [...new Set(allUrls)];

    const existingMedia = await mediaRepo.find({
      where: { url: In(uniqueUrls) },
    });
    const existingUrlMap = new Map<string, MediaEntity>(
      existingMedia.map((m) => [m.url, m]),
    );

    const newMediaEntities = [];

    const missingUrls = uniqueUrls.filter((url) => !existingUrlMap.has(url));

    for (const url of missingUrls) {
      newMediaEntities.push(
        mediaRepo.create({
          url,
          type: MediaTypeEnum.IMAGE,
        }),
      );
    }

    if (newMediaEntities.length > 0) {
      const savedMedia = await mediaRepo.save(newMediaEntities);
      this.logger.log(`Seeded ${savedMedia.length} media items`);
      for (const m of savedMedia) {
        existingUrlMap.set(m.url, m);
      }
    }

    const mediaByMovieId = new Map<string, MediaEntity>();
    for (const [movieId, url] of Object.entries(TEST_MEDIA_COVERS)) {
      if (existingUrlMap.has(url)) {
        mediaByMovieId.set(movieId, existingUrlMap.get(url));
      }
    }

    return mediaByMovieId;
  }

  private async seedStudios() {
    const repo = this.dataSource.getRepository(StudioEntity);
    const existingStudios = await repo.find({
      where: { id: In(TEST_STUDIOS.map((s) => s.id)) },
    });
    const existingIds = new Set(existingStudios.map((s) => s.id));
    const studiosToInsert = TEST_STUDIOS.filter((s) => !existingIds.has(s.id));

    if (studiosToInsert.length > 0) {
      await repo.save(studiosToInsert);
      this.logger.log(`Seeded ${studiosToInsert.length} studios`);
    }
  }

  private async seedPersons() {
    const repo = this.dataSource.getRepository(PersonEntity);
    const existingPersons = await repo.find({
      where: { id: In(TEST_PERSONS.map((p) => p.id)) },
    });
    const existingIds = new Set(existingPersons.map((p) => p.id));
    const personsToInsert = TEST_PERSONS.filter((p) => !existingIds.has(p.id));

    if (personsToInsert.length > 0) {
      await repo.save(personsToInsert);
      this.logger.log(`Seeded ${personsToInsert.length} persons`);
    }
  }

  private async seedUsers() {
    const repo = this.dataSource.getRepository(UserEntity);
    const existingUsers = await repo.find({
      where: { id: In(TEST_USERS.map((u) => u.id)) },
    });
    const existingIds = new Set(existingUsers.map((u) => u.id));
    const usersToInsert = TEST_USERS.filter((u) => !existingIds.has(u.id));

    if (usersToInsert.length > 0) {
      await repo.save(usersToInsert);
      this.logger.log(`Seeded ${usersToInsert.length} users`);
    }
  }

  private async seedMovies(mediaMap: Map<string, MediaEntity>) {
    const movieRepo = this.dataSource.getRepository(MovieEntity);
    const seriesRepo = this.dataSource.getRepository(SeriesEntity);
    const filmRepo = this.dataSource.getRepository(FilmEntity);
    const genreRepo = this.dataSource.getRepository(GenreEntity);
    const countryRepo = this.dataSource.getRepository(CountryEntity);
    const studioRepo = this.dataSource.getRepository(StudioEntity);
    const moviePersonRepo = this.dataSource.getRepository(MoviePersonEntity);

    const existingMovies = await movieRepo.find({
      where: { id: In(TEST_MOVIES.map((m) => m.id)) },
    });
    const existingIds = new Set(existingMovies.map((m) => m.id));
    const moviesToInsert = TEST_MOVIES.filter((m) => !existingIds.has(m.id));

    if (moviesToInsert.length === 0) {
      return;
    }

    const allGenreNames = [...new Set(moviesToInsert.flatMap((m) => m.genres))];
    const allCountryIds = [
      ...new Set(moviesToInsert.flatMap((m) => m.countries)),
    ];
    const allStudioIds = [...new Set(moviesToInsert.flatMap((m) => m.studios))];

    const [genres, countries, studios] = await Promise.all([
      genreRepo.find({ where: { name: In(allGenreNames) } }),
      countryRepo.find({ where: { id: In(allCountryIds) } }),
      studioRepo.find({ where: { id: In(allStudioIds) } }),
    ]);

    const genreMap = new Map<string, GenreEntity>(
      genres.map((g) => [g.name, g] as [string, GenreEntity]),
    );
    const countryMap = new Map<string, CountryEntity>(
      countries.map((c) => [c.id, c] as [string, CountryEntity]),
    );
    const studioMap = new Map<number, StudioEntity>(
      studios.map((s) => [s.id, s] as [number, StudioEntity]),
    );

    const moviesEntities = moviesToInsert.map((movieData) => {
      const baseData = {
        ...movieData,
        genres: movieData.genres
          .map((name) => genreMap.get(name))
          .filter(Boolean),
        countries: movieData.countries
          .map((id) => countryMap.get(id))
          .filter(Boolean),
        studios: movieData.studios
          .map((id) => studioMap.get(id))
          .filter(Boolean),
        cover: mediaMap.get(movieData.id) || null,
      };

      if (movieData.type === MovieTypeEnum.Film) {
        return filmRepo.create({
          ...baseData,
          releaseDate: movieData.releaseDate,
        });
      } else {
        return seriesRepo.create({
          ...baseData,
          startReleaseDate: movieData.startReleaseDate,
          endReleaseDate: movieData.endReleaseDate,
        });
      }
    });

    const savedMovies = await movieRepo.save(moviesEntities);
    this.logger.log(`Seeded ${savedMovies.length} movies`);

    const candidatePersons = moviesToInsert.flatMap((movieData) =>
      (movieData.persons ?? []).map((p) => ({
        movieId: movieData.id,
        personId: p.personId,
        role: p.role,
        typeId: p.typeId,
      })),
    );

    if (candidatePersons.length === 0) {
      return;
    }

    const existingMoviesPersons = await moviePersonRepo.find({
      where: {
        movieId: In(TEST_MOVIES.map((m) => m.id)),
      },
    });

    const existingKeys = new Set(
      existingMoviesPersons.map(
        (l) => `${l.movieId}_${l.personId}_${l.role}_${l.typeId}`,
      ),
    );

    const moviesPersonsToInsert = candidatePersons.filter(
      (l) =>
        !existingKeys.has(`${l.movieId}_${l.personId}_${l.role}_${l.typeId}`),
    );

    if (moviesPersonsToInsert.length > 0) {
      await moviePersonRepo.save(moviesPersonsToInsert);
      this.logger.log(`Seeded ${moviesPersonsToInsert.length} movie persons`);
    }
  }

  private async seedReviews() {
    const repo = this.dataSource.getRepository(MovieReviewEntity);
    const existingReviews = await repo.find({
      where: { id: In(TEST_REVIEWS.map((r) => r.id)) },
    });
    const existingIds = new Set(existingReviews.map((r) => r.id));
    const reviewsToInsert = TEST_REVIEWS.filter((r) => !existingIds.has(r.id));

    if (reviewsToInsert.length > 0) {
      await repo.save(reviewsToInsert);
      this.logger.log(`Seeded ${reviewsToInsert.length} reviews`);
    }
  }
}
