export interface RedisModuleOptions {
  url: string;
}

export interface RedisModuleAsyncOptions {
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => RedisModuleOptions | Promise<RedisModuleOptions>;
}
