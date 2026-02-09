import { applyArgs, getCount, getMany } from './typeorm-query-parser';
import {
  Repository,
  SelectQueryBuilder,
  EntityManager,
  EntityMetadata,
} from 'typeorm';

describe('TypeormQueryParser', () => {
  let mockBuilder: Partial<SelectQueryBuilder<any>>;
  let mockRepo: Partial<Repository<any>>;
  let mockEntityManager: Partial<EntityManager>;
  let mockMetadata: Partial<EntityMetadata>;

  beforeEach(() => {
    mockBuilder = {
      alias: 'entity',
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      distinctOn: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      expressionMap: { joinAttributes: [] } as any,
    };

    mockMetadata = {
      name: 'TestEntity',
      primaryColumns: [{ propertyName: 'id' } as any],
      relations: [],
    };

    mockEntityManager = {
      connection: {
        getMetadata: jest.fn(),
      } as any,
    };

    mockRepo = {
      metadata: mockMetadata as EntityMetadata,
      manager: mockEntityManager as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(mockBuilder),
    };
  });

  describe('applyArgs', () => {
    it('should apply simple filter', () => {
      const args = {
        filter: { name: { eq: 'test' } },
      };

      applyArgs(
        mockRepo as Repository<any>,
        mockBuilder as SelectQueryBuilder<any>,
        args,
      );

      expect(mockBuilder.andWhere).toHaveBeenCalled();
    });

    it('should apply sorting', () => {
      const args = {
        sort: { name: { direction: 'ASC' } },
      };

      applyArgs(
        mockRepo as Repository<any>,
        mockBuilder as SelectQueryBuilder<any>,
        args,
      );

      expect(mockBuilder.addOrderBy).toHaveBeenCalled();
    });

    it('should apply pagination (offset)', () => {
      const args = {};
      const pagination = { offset: 10, limit: 5 };

      applyArgs(
        mockRepo as Repository<any>,
        mockBuilder as SelectQueryBuilder<any>,
        args,
        pagination,
      );

      expect(mockBuilder.limit).toHaveBeenCalledWith(5);
      expect(mockBuilder.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('getMany', () => {
    it('should call getMany on builder', async () => {
      const filter = { id: { eq: 1 } };
      (mockBuilder.getMany as jest.Mock).mockResolvedValue(['result']);

      const result = await getMany(
        mockRepo as Repository<any>,
        undefined, // pagination
        undefined, // sort
        filter,
      );

      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockBuilder.andWhere).toHaveBeenCalled();
      expect(mockBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(['result']);
    });
  });

  describe('getCount', () => {
    it('should call getCount on builder', async () => {
      const filter = { id: { eq: 1 } };
      (mockBuilder.getCount as jest.Mock).mockResolvedValue(10);

      const result = await getCount(mockRepo as Repository<any>, filter);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockBuilder.andWhere).toHaveBeenCalled();
      expect(mockBuilder.getCount).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });
});
