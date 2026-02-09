import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RoleEnum } from '@utils/enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any) => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getNext: jest.fn().mockReturnValue({
          req: { user },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext({ role: RoleEnum.User });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.Admin,
    ]);
    const context = createMockContext({ role: RoleEnum.Admin });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.Admin,
    ]);
    const context = createMockContext({ role: RoleEnum.User });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if no user attached', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([RoleEnum.User]);
    const context = createMockContext(null);

    expect(guard.canActivate(context)).toBeFalsy();
  });
});
