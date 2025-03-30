import { ContextType, ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const reqType = requestProps.context.getType<ContextType>();

    if (reqType === 'ws') {
      const { context, limit, ttl, throttler, blockDuration, generateKey } =
        requestProps;

      const client = context.switchToWs().getClient();
      const tracker = client._socket.remoteAddress;
      const key = generateKey(context, tracker, throttler.name);
      const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
        await this.storageService.increment(
          key,
          ttl,
          limit,
          blockDuration,
          throttler.name,
        );

      if (isBlocked) {
        await this.throwThrottlingException(context, {
          limit,
          ttl,
          key,
          tracker,
          totalHits,
          timeToExpire,
          isBlocked,
          timeToBlockExpire,
        });
      }
    }

    return super.handleRequest(requestProps);
  }

  getRequestResponse(context: ExecutionContext) {
    const reqType = context.getType<ContextType | 'graphql'>();
    if (reqType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req, res: ctx.res };
    }
    return super.getRequestResponse(context);
  }
}
