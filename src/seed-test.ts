import { NestFactory } from '@nestjs/core';
import { SeedingModule } from './seeding/seeding.module';
import { TestSeedingService } from './seeding/test-seeding.service';
import { INestApplicationContext, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TestSeeding');
  let app: INestApplicationContext;

  try {
    app = await NestFactory.createApplicationContext(SeedingModule);
    const seedingService = app.get(TestSeedingService);

    logger.log('Starting test seeding...');
    await seedingService.seedTestData();
    logger.log('Test seeding completed successfully.');

    if (app) {
      await app.close();
    }

    process.exit(0);
  } catch (error) {
    logger.error('Test seeding failed:', error);

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
