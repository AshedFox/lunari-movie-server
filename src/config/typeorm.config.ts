import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    return {
      type: 'postgres',
      url: this.configService.get('CONNECTION_STRING'),
      synchronize: !isProduction,
      autoLoadEntities: true,
      logging: isProduction ? ['error', 'warn', 'migration'] : true,
      maxQueryExecutionTime: isProduction ? 500 : undefined,
      logger: 'advanced-console',
      namingStrategy: new SnakeNamingStrategy(),
    };
  }
}
