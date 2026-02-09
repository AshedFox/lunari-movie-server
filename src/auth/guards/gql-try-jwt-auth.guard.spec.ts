import { Test, TestingModule } from '@nestjs/testing';
import { GqlTryJwtAuthGuard } from './gql-try-jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';

describe('GqlTryJwtAuthGuard', () => {
  let guard: GqlTryJwtAuthGuard;
  let gqlCreateSpy: jest.SpyInstance;

  const mockConfigService = {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'ACCESS_TOKEN_SECRET') return 'secret';
      if (key === 'ACCESS_TOKEN_LIFETIME') return '1h';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GqlTryJwtAuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<GqlTryJwtAuthGuard>(GqlTryJwtAuthGuard);
    gqlCreateSpy = jest.spyOn(GqlExecutionContext, 'create');
  });

  afterEach(() => {
    jest.clearAllMocks();
    gqlCreateSpy.mockRestore();
  });

  const createMockContext = (headers: any = {}) => {
    const mockRequest = {
      headers,
      user: null as any,
    };

    gqlCreateSpy.mockReturnValue({
      getContext: () => ({ req: mockRequest }),
    } as any);

    return {
      switchToHttp: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: () => [{}, {}, { req: mockRequest }, {}],
    } as unknown as ExecutionContext;
  };

  it('should allow access and attach user when token is valid', () => {
    const token = 'valid-token';
    const payload = { sub: 'user-123', role: 'USER' };
    const context = createMockContext({ authorization: `Bearer ${token}` });

    const verifySpy = jest
      .spyOn((guard as any).jwtService, 'verify')
      .mockReturnValue(payload);

    const result = guard.canActivate(context);
    const req = GqlExecutionContext.create(context).getContext().req;

    expect(result).toBe(true);
    expect(verifySpy).toHaveBeenCalledWith(token);
    expect(req.user).toEqual({ id: payload.sub, role: payload.role });
  });

  it('should allow access without user when no token provided', () => {
    const context = createMockContext({});
    const verifySpy = jest.spyOn((guard as any).jwtService, 'verify');

    const result = guard.canActivate(context);
    const req = GqlExecutionContext.create(context).getContext().req;

    expect(result).toBe(true);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(req.user).toBeNull();
  });

  it('should allow access without user when token is invalid', () => {
    const token = 'invalid-token';
    const context = createMockContext({ authorization: `Bearer ${token}` });

    const verifySpy = jest
      .spyOn((guard as any).jwtService, 'verify')
      .mockImplementation(() => {
        throw new Error('Invalid token');
      });

    const result = guard.canActivate(context);
    const req = GqlExecutionContext.create(context).getContext().req;

    expect(result).toBe(true);
    expect(verifySpy).toHaveBeenCalledWith(token);
    expect(req.user).toBeNull();
  });
});
