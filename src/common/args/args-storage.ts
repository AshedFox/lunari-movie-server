import { Type } from '@nestjs/common';
import { ArgsType } from './args.type';

export const ArgsStorage: Map<
  string,
  Type<ArgsType<unknown>>
> = global.GqlArgsStorage ||
(global.GqlArgsStorage = new Map<string, Type<ArgsType<unknown>>>());
