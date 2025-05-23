import { Injectable } from '@nestjs/common';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { CreateEpisodeInput } from './dto/create-episode.input';
import { UpdateEpisodeInput } from './dto/update-episode.input';
import { EpisodeEntity } from './entities/episode.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@common/services/base.service';
import { SeriesService } from '../series/series.service';
import { SeasonService } from '../season/season.service';

@Injectable()
export class EpisodeService extends BaseService<
  EpisodeEntity,
  CreateEpisodeInput,
  UpdateEpisodeInput
> {
  constructor(
    @InjectRepository(EpisodeEntity)
    private readonly episodeRepository: Repository<EpisodeEntity>,
    private readonly seriesService: SeriesService,
    private readonly seasonService: SeasonService,
  ) {
    super(episodeRepository);
  }

  create = async (
    createEpisodeInput: CreateEpisodeInput,
  ): Promise<EpisodeEntity> => {
    const { seriesId, numberInSeries, seasonId, numberInSeason } =
      createEpisodeInput;

    const series = await this.seriesService.readOne(seriesId);
    const season = await this.seasonService.readOne(seasonId);

    const seriesEpisode = await this.episodeRepository.findOneBy({
      seriesId,
      numberInSeries,
    });

    if (seriesEpisode) {
      throw new AlreadyExistsError(
        `Episode with seriesId "${seriesId}" and numberInSeries "${numberInSeries}" already exists!`,
      );
    }

    const seasonEpisode = await this.episodeRepository.findOneBy({
      seasonId,
      numberInSeason,
    });

    if (seasonEpisode) {
      throw new AlreadyExistsError(
        `Episode with seasonId "${seasonId}" and numberInSeason "${numberInSeason}" already exists!`,
      );
    }

    return this.episodeRepository.save({
      accessMode: season.accessMode ?? series.accessMode,
      ageRestriction: season.ageRestriction ?? series.ageRestriction,
      ...createEpisodeInput,
    });
  };

  readOneByNumberInSeason = async (
    seasonId: string,
    numberInSeason: number,
  ) => {
    const episode = await this.episodeRepository.findOneBy({
      seasonId,
      numberInSeason,
    });

    if (!episode) {
      throw new NotFoundError(
        `Episode with seasonId "${seasonId}" and numberInSeason "${numberInSeason}" not found!`,
      );
    }

    return episode;
  };

  readOneByNumberInSeries = async (
    seriesId: string,
    numberInSeries: number,
  ) => {
    const episode = await this.episodeRepository.findOneBy({
      seriesId,
      numberInSeries,
    });
    if (!episode) {
      throw new NotFoundError(
        `Episode with seriesId "${seriesId}" and numberInSeries "${numberInSeries}" not found!`,
      );
    }

    return episode;
  };
}
