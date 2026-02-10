import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { DirectiveLocation, GraphQLDirective } from 'graphql/index';
import { DataLoaderFactory } from '../dataloader/data-loader.factory';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { join } from 'path';

@Injectable()
export class GraphQLConfig implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  createGqlOptions():
    | Promise<Omit<ApolloDriverConfig, 'driver'>>
    | Omit<ApolloDriverConfig, 'driver'> {
    return {
      context: (ctx) => {
        const req = ctx.extra?.request || ctx.req;
        return {
          ...ctx,
          req,
          loadersFactory: new DataLoaderFactory(this.entityManager),
        };
      },
      csrfPrevention: true,
      introspection:
        this.configService.get<string>('NODE_ENV') === 'development',
      autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
      sortSchema: true,
      buildSchemaOptions: {
        directives: [
          new GraphQLDirective({
            name: 'upper',
            locations: [DirectiveLocation.FIELD_DEFINITION],
          }),
        ],
      },
      subscriptions: {
        'graphql-ws': true,
      },
      graphiql: this.configService.get<string>('NODE_ENV') === 'development',
    };
  }
}
