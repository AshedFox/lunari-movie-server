import { Test, TestingModule } from '@nestjs/testing';
import { GqlJwtAuthGuard } from './gql-jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';

describe('GqlJwtAuthGuard', () => {
  let guard: GqlJwtAuthGuard;
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
        GqlJwtAuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<GqlJwtAuthGuard>(GqlJwtAuthGuard);
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

  it('should throw UnauthorizedException when no token provided', () => {
    const context = createMockContext({});
    const verifySpy = jest.spyOn((guard as any).jwtService, 'verify');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    const token = 'invalid-token';
    const context = createMockContext({ authorization: `Bearer ${token}` });

    const verifySpy = jest
      .spyOn((guard as any).jwtService, 'verify')
      .mockImplementation(() => {
        throw new Error('Invalid token');
      });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(verifySpy).toHaveBeenCalledWith(token);
  });
});
