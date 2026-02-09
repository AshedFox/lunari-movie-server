import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import {
  RedisModuleAsyncOptions,
  RedisModuleOptions,
} from './redis.interfaces';

@Global()
@Module({})
export class RedisModule {
  static forRoot(options: RedisModuleOptions): DynamicModule {
    const redisProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(options.url),
    };

    return {
      module: RedisModule,
      providers: [redisProvider],
      exports: [REDIS_CLIENT],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const redisProvider: Provider = {
      provide: REDIS_CLIENT,
      inject: options.inject || [],
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);
        return new Redis(config.url);
      },
    };

    return {
      module: RedisModule,
      providers: [redisProvider],
      exports: [REDIS_CLIENT],
    };
  }
}
