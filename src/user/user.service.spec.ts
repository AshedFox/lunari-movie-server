import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { RoleEnum } from '@utils/enums';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<Partial<Repository<UserEntity>>>;
  let stripeService: jest.Mocked<Partial<StripeService>>;

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
    userRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    stripeService = {
      updateCustomer: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepository },
        { provide: StripeService, useValue: stripeService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await userService.create({
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        customerId: 'cus_123',
      });

      expect(result).toEqual(mockUser);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw AlreadyExistsError when user exists', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(
        userService.create({
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed_password',
          customerId: 'cus_123',
        }),
      ).rejects.toThrow(AlreadyExistsError);
    });
  });

  describe('readOneById', () => {
    it('should return user when found', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await userService.readOneById('user-123');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-123' });
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(userService.readOneById('unknown')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('readOneByEmail', () => {
    it('should return user when found', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await userService.readOneByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(
        userService.readOneByEmail('unknown@example.com'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      userRepository.findOneBy.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.update('user-123', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(
        userService.update('unknown', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AlreadyExistsError when email is taken', async () => {
      const anotherUser = {
        ...mockUser,
        id: 'user-456',
        email: 'taken@example.com',
      };
      userRepository.findOneBy
        .mockResolvedValueOnce(mockUser) // First call - find current user
        .mockResolvedValueOnce(anotherUser); // Second call - find by new email

      await expect(
        userService.update('user-123', { email: 'taken@example.com' }),
      ).rejects.toThrow(AlreadyExistsError);
    });

    it('should update Stripe customer when email or name changes', async () => {
      const updatedUser = { ...mockUser, email: 'new@example.com' };
      userRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(updatedUser);

      await userService.update('user-123', { email: 'new@example.com' });

      expect(stripeService.updateCustomer).toHaveBeenCalledWith(
        'cus_123',
        'new@example.com',
        'Test User',
      );
    });
  });

  describe('updatePassword', () => {
    it('should return true on successful update', async () => {
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await userService.updatePassword(
        'user-123',
        'new_hashed_password',
      );

      expect(result).toBe(true);
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        password: 'new_hashed_password',
      });
    });

    it('should return false on error', async () => {
      userRepository.update.mockRejectedValue(new Error('DB Error'));

      const result = await userService.updatePassword(
        'user-123',
        'new_password',
      );

      expect(result).toBe(false);
    });
  });

  describe('setEmailConfirmed', () => {
    it('should set isEmailConfirmed to true', async () => {
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      await userService.setEmailConfirmed('user-123');

      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        isEmailConfirmed: true,
      });
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      const result = await userService.delete('user-123');

      expect(result).toEqual(mockUser);
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(userService.delete('unknown')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
