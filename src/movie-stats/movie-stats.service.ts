import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class MovieStatsService {
  private readonly logger = new Logger(MovieStatsService.name);

  constructor(private dataSource: DataSource) {}

  @Cron('0,30 * * * *')
  async handleCron() {
    try {
      this.logger.log('Refreshing movies_stats materialized view...');
      await this.dataSource.query(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY movies_stats;',
      );
      this.logger.log('Materialized view movies_stats refreshed.');
    } catch (error) {
      this.logger.error(
        'Failed to refresh movies_stats materialized view',
        error,
      );
    }
  }
}
