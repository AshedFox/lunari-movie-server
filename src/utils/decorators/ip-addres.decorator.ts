import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const IpAddres = createParamDecorator(
  (_: unknown, context: ExecutionContext): string => {
    return GqlExecutionContext.create(context).getContext().req.ip;
  },
);
