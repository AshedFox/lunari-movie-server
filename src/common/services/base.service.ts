import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';
import { PaginationArgsType } from '@common/pagination';
import { SortType } from '@common/sort';
import { FilterType } from '@common/filter';
import { getCount, getMany } from '@common/typeorm-query-parser';

export abstract class BaseService<
  T extends { id: string | number },
  C extends DeepPartial<T>,
  U extends DeepPartial<T>,
  K extends keyof T = 'id',
> {
  protected constructor(private readonly repository: Repository<T>) {}

  exists = async (where: FindOptionsWhere<T>) => {
    return this.repository.exists({
      where,
    });
  };

  count = async (filter?: FilterType<T>): Promise<number> => {
    return getCount(this.repository, filter);
  };

  create = async (input: C): Promise<T> => {
    try {
      return this.repository.save(input);
    } catch {
      throw new AlreadyExistsError(`${this.repository.target} already exists!`);
    }
  };

  createMany = async (input: C[]): Promise<T[]> => {
    try {
      return this.repository.save(input);
    } catch {
      throw new AlreadyExistsError(`Already exists!`);
    }
  };

  readOne = async (id: T[K]): Promise<T> => {
    const entity = await this.repository
      .createQueryBuilder()
      .whereInIds(id)
      .getOne();

    if (!entity) {
      throw new NotFoundError(
        `${this.repository.target} with id ${id} not found!`,
      );
    }

    return entity;
  };

  readMany = async (
    pagination?: PaginationArgsType,
    sort?: SortType<T>,
    filter?: FilterType<T>,
  ): Promise<T[]> => {
    return getMany(this.repository, pagination, sort, filter);
  };

  update = async (id: T[K], input: U): Promise<T> => {
    if (this.repository.hasId(input as T)) {
      throw new Error('Could not specify id in update input!');
    }

    const entity = await this.readOne(id);

    return this.repository.save({
      ...entity,
      ...input,
    });
  };

  delete = async (id: T[K]): Promise<T> => {
    const entity = await this.repository
      .createQueryBuilder()
      .whereInIds(id)
      .getOne();

    if (!entity) {
      throw new NotFoundError(
        `${this.repository.target} with id ${id} not found!`,
      );
    }

    const removed = await this.repository.remove(entity);
    return {
      ...removed,
      id,
    };
  };

  deleteMany = async (ids: T[K][]): Promise<T[]> => {
    const entities = await this.repository.findBy({
      id: In(ids as any[]),
    } as any);

    return this.repository.remove(entities);
  };
}
