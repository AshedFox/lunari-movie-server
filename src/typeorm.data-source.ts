import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

config();

const dataSource = new DataSource({
  type: 'postgres',
  entities: [__dirname + '/**/*.{entity,view}{.js,.ts}'],
  migrations: [__dirname + '/../migrations/*{.js,.ts}'],
  url: process.env.CONNECTION_STRING,
  namingStrategy: new SnakeNamingStrategy(),
});

export default dataSource;
