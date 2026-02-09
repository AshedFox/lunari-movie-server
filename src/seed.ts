import { NestFactory } from '@nestjs/core';
import { SeedingModule } from './seeding/seeding.module';
import { SeedingService } from './seeding/seeding.service';
import { INestApplicationContext, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seeding');
  let app: INestApplicationContext;

  try {
    app = await NestFactory.createApplicationContext(SeedingModule);
    const seedingService = app.get(SeedingService);

    logger.log('Starting seeding...');
    await seedingService.seed();
    logger.log('Seeding completed successfully.');

    if (app) {
      await app.close();
    }

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);

    if (app) {
      try {
        await app.close();
      } catch (closeError) {
        logger.error('Error while closing app inside catch block', closeError);
      }
    }

    process.exit(1);
  }
}

bootstrap();
