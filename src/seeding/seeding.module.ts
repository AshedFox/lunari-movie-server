import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingService } from './seeding.service';
import { TestSeedingService } from './test-seeding.service';
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
  ],
  providers: [SeedingService, TestSeedingService],
  exports: [SeedingService, TestSeedingService],
})
export class SeedingModule {}
