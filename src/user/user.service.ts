import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserEntity } from './entities/user.entity';
import { PaginatedUsers } from './dto/paginated-users';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { OffsetPaginationArgsType } from '@common/pagination/offset';
import { SortType } from '@common/sort';
import { FilterType } from '@common/filter';
import { getCount, getMany } from '@common/typeorm-query-parser';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly stripeService: StripeService,
  ) {}

  create = async (createUserInput: CreateUserInput): Promise<UserEntity> => {
    const { email } = createUserInput;
    const user = await this.userRepository.findOneBy({
      email,
    });
    if (user) {
      throw new AlreadyExistsError(
        `User with email "${email}" already exists!`,
      );
    }
    return this.userRepository.save(createUserInput);
  };

  readMany = async (
    pagination?: OffsetPaginationArgsType,
    sort?: SortType<UserEntity>,
    filter?: FilterType<UserEntity>,
  ): Promise<PaginatedUsers> => {
    const users = await getMany(this.userRepository, pagination, sort, filter);
    const count = await getCount(this.userRepository, filter);

    const { limit, offset } = pagination;

    return {
      nodes: users,
      pageInfo: {
        totalCount: count,
        hasNextPage: count > limit + offset,
        hasPreviousPage: offset > 0,
      },
    };
  };

  readOneById = async (id: string): Promise<UserEntity> => {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundError(`User with id "${id}" not found!`);
    }
    return user;
  };

  readOneByEmail = async (email: string): Promise<UserEntity> => {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundError(`User with email "${email}" not found!`);
    }
    return user;
  };

  update = async (
    id: string,
    updateUserInput: UpdateUserInput,
  ): Promise<UserEntity> => {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundError(`User with id "${id}" not found!`);
    }
    if (updateUserInput.email && updateUserInput.email !== user.email) {
      const userByEmail = await this.userRepository.findOneBy({
        email: updateUserInput.email,
      });

      if (!!userByEmail) {
        throw new AlreadyExistsError('User with this email already exists!');
      }
    }

    const updatedUser = await this.userRepository.save({
      ...user,
      ...updateUserInput,
      isEmailConfirmed:
        updateUserInput.email && user.email !== updateUserInput.email
          ? false
          : user.isEmailConfirmed,
    });

    if (updatedUser.email !== user.email || updatedUser.name !== user.name) {
      await this.stripeService.updateCustomer(
        updatedUser.customerId,
        updatedUser.email,
        updatedUser.name,
      );
    }

    return updatedUser;
  };

  updatePassword = async (id: string, newPassword: string) => {
    try {
      await this.userRepository.update(id, {
        password: newPassword,
      });

      return true;
    } catch {
      return false;
    }
  };

  setEmailConfirmed = async (id: string) => {
    await this.userRepository.update(id, { isEmailConfirmed: true });
  };

  delete = async (id: string): Promise<UserEntity> => {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundError(`User with id "${id}" not found!`);
    }
    return this.userRepository.remove(user);
  };
}
