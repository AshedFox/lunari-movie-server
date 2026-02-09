import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../stripe/stripe.service';
import { MailingService } from '../mailing/services/mailing.service';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserEntity } from '../user/entities/user.entity';
import { RoleEnum } from '@utils/enums';
import { AlreadyExistsError } from '@utils/errors';
import { STRIPE_CLEANUP_QUEUE } from '../stripe/stripe.constants';
import * as argon2 from 'argon2';

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<Partial<UserService>>;
  let accessJwtService: jest.Mocked<Partial<JwtService>>;
  let refreshJwtService: jest.Mocked<Partial<JwtService>>;
  let resetPasswordJwtService: jest.Mocked<Partial<JwtService>>;
  let redis: any;
  let stripeService: jest.Mocked<Partial<StripeService>>;
  let mailingService: jest.Mocked<Partial<MailingService>>;
  let cleanupQueue: any;

  const mockUser: UserEntity = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    role: RoleEnum.User,
    isEmailConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    customerId: 'cus_123',
    purchases: [],
    subscriptions: [],
    rooms: [],
  };

  beforeEach(async () => {
    userService = {
      readOneById: jest.fn(),
      readOneByEmail: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
    };

    accessJwtService = {
      signAsync: jest.fn().mockResolvedValue('access_token'),
    };

    refreshJwtService = {
      signAsync: jest.fn().mockResolvedValue('refresh_token'),
      verify: jest.fn(),
    };

    resetPasswordJwtService = {
      signAsync: jest.fn().mockResolvedValue('reset_token'),
      verify: jest.fn(),
    };

    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      getdel: jest.fn(),
      del: jest.fn(),
    };

    stripeService = {
      createCustomer: jest.fn().mockResolvedValue({ id: 'cus_123' }),
    };

    mailingService = {
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    cleanupQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('1h') },
        },
        { provide: 'ACCESS_JWT_SERVICE', useValue: accessJwtService },
        { provide: 'REFRESH_JWT_SERVICE', useValue: refreshJwtService },
        {
          provide: 'RESET_PASSWORD_JWT_SERVICE',
          useValue: resetPasswordJwtService,
        },
        { provide: 'default_IORedisModuleConnectionToken', useValue: redis },
        { provide: UserService, useValue: userService },
        { provide: StripeService, useValue: stripeService },
        { provide: MailingService, useValue: mailingService },
        {
          provide: getQueueToken(STRIPE_CLEANUP_QUEUE),
          useValue: cleanupQueue,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return auth result on successful login', async () => {
      userService.readOneByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(userService.readOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw UnauthorizedException on incorrect password', async () => {
      userService.readOneByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should create user and return auth result', async () => {
      userService.create.mockResolvedValue(mockUser);

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        passwordRepeat: 'password123',
        name: 'Test User',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(stripeService.createCustomer).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'password123',
          passwordRepeat: 'different',
          name: 'Test User',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already exists', async () => {
      userService.create.mockRejectedValue(
        new AlreadyExistsError('User already exists'),
      );

      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'password123',
          passwordRepeat: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);

      expect(cleanupQueue.add).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should return new auth result with valid refresh token', async () => {
      refreshJwtService.verify.mockReturnValue({ sub: 'user-123' });
      redis.getdel.mockResolvedValue('refresh_token');
      userService.readOneById.mockResolvedValue(mockUser);

      const result = await authService.refresh('refresh_token');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      refreshJwtService.verify.mockReturnValue({ sub: 'user-123' });
      redis.getdel.mockResolvedValue(null);

      await expect(authService.refresh('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should return true when token is deleted', async () => {
      redis.del.mockResolvedValue(1);

      const result = await authService.logout('user-123', 'refresh_token');

      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('refresh:user-123:refresh_token');
    });

    it('should return false when token was not found', async () => {
      redis.del.mockResolvedValue(0);

      const result = await authService.logout('user-123', 'unknown_token');

      expect(result).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      userService.readOneById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      userService.updatePassword.mockResolvedValue(true);

      const result = await authService.updatePassword(
        'user-123',
        'oldPassword',
        'newPassword',
      );

      expect(result).toBe(true);
      expect(userService.updatePassword).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on incorrect old password', async () => {
      userService.readOneById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.updatePassword('user-123', 'wrongOld', 'newPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user not found', async () => {
      userService.readOneById.mockResolvedValue(null);

      await expect(
        authService.updatePassword('unknown', 'old', 'new'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email when user exists', async () => {
      userService.readOneByEmail.mockResolvedValue(mockUser);

      const result = await authService.forgotPassword('test@example.com');

      expect(result).toBe(true);
      expect(mailingService.sendPasswordReset).toHaveBeenCalledWith(
        'test@example.com',
        'reset_token',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      userService.readOneByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword('unknown@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      resetPasswordJwtService.verify.mockReturnValue({ sub: 'user-123' });
      redis.getdel.mockResolvedValue('reset_token');
      userService.updatePassword.mockResolvedValue(true);

      const result = await authService.resetPassword({
        token: 'reset_token',
        newPassword: 'newPassword123',
      });

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      resetPasswordJwtService.verify.mockReturnValue({ sub: 'user-123' });
      redis.getdel.mockResolvedValue(null);

      await expect(
        authService.resetPassword({ token: 'invalid', newPassword: 'new' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when stored token does not match', async () => {
      resetPasswordJwtService.verify.mockReturnValue({ sub: 'user-123' });
      redis.getdel.mockResolvedValue('different_token');

      await expect(
        authService.resetPassword({ token: 'reset_token', newPassword: 'new' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
