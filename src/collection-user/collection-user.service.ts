import { Injectable } from '@nestjs/common';
import { CreateCollectionUserInput } from './dto/create-collection-user.input';
import { UpdateCollectionUserInput } from './dto/update-collection-user.input';
import { CollectionUserEntity } from './entities/collection-user.entity';
import { Repository } from 'typeorm';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionService } from '../collection/collection.service';
import { UserService } from '../user/user.service';
import { OffsetPaginationArgsType } from '@common/pagination/offset';
import { FilterType } from '@common/filter';
import { SortType } from '@common/sort';
import { getCount, getMany } from '@common/typeorm-query-parser';

@Injectable()
export class CollectionUserService {
  constructor(
    @InjectRepository(CollectionUserEntity)
    private readonly collectionUserRepository: Repository<CollectionUserEntity>,
    private readonly collectionService: CollectionService,
    private readonly userService: UserService,
  ) {}

  count = async (
    filter?: FilterType<CollectionUserEntity>,
  ): Promise<number> => {
    return getCount(this.collectionUserRepository, filter);
  };

  create = async (
    createCollectionUserInput: CreateCollectionUserInput & { userId: string },
  ) => {
    const { userId, collectionId } = createCollectionUserInput;
    await this.collectionService.readOne(collectionId);
    await this.userService.readOneById(userId);
    const collectionUser = await this.collectionUserRepository.findOneBy({
      collectionId,
      userId,
    });
    if (collectionUser) {
      throw new AlreadyExistsError(
        `Collection user with collectionId "${collectionId}" and userId "${userId}" already exists!`,
      );
    }
    return this.collectionUserRepository.save(createCollectionUserInput);
  };

  readMany = async (
    pagination?: OffsetPaginationArgsType,
    sort?: SortType<CollectionUserEntity>,
    filter?: FilterType<CollectionUserEntity>,
  ): Promise<CollectionUserEntity[]> => {
    return getMany(this.collectionUserRepository, pagination, sort, filter);
  };

  readOne = async (
    collectionId: number,
    userId: string,
  ): Promise<CollectionUserEntity> => {
    const collectionUser = await this.collectionUserRepository.findOneBy({
      collectionId,
      userId,
    });
    if (!collectionUser) {
      throw new NotFoundError(
        `Collection user with collectionId "${collectionId}" and userId "${userId}" not found!`,
      );
    }
    return collectionUser;
  };

  update = async (
    collectionId: number,
    userId: string,
    updateCollectionUserInput: UpdateCollectionUserInput,
  ): Promise<CollectionUserEntity> => {
    const collectionUser = await this.collectionUserRepository.findOneBy({
      collectionId,
      userId,
    });
    if (!collectionUser) {
      throw new NotFoundError(
        `Collection user with collectionId "${collectionId}" and userId "${userId}" not found!`,
      );
    }
    return this.collectionUserRepository.save({
      ...collectionUser,
      ...updateCollectionUserInput,
    });
  };

  delete = async (
    collectionId: number,
    userId: string,
  ): Promise<CollectionUserEntity> => {
    const collectionUser = await this.collectionUserRepository.findOneBy({
      collectionId,
      userId,
    });
    if (!collectionUser) {
      throw new NotFoundError(
        `Collection user with collectionId "${collectionId}" and userId "${userId}" not found!`,
      );
    }
    return this.collectionUserRepository.remove(collectionUser);
  };
}
