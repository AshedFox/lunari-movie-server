import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from './base.service';
import { AlreadyExistsError, NotFoundError } from '@utils/errors';

// Test entity interface
interface TestEntity {
  id: string;
  name: string;
}

// Concrete implementation for testing
class TestService extends BaseService<
  TestEntity,
  Partial<TestEntity>,
  Partial<TestEntity>
> {
  constructor(repository: Repository<TestEntity>) {
    super(repository);
  }
}

describe('BaseService', () => {
  let service: TestService;
  let repository: jest.Mocked<Partial<Repository<TestEntity>>>;
  let queryBuilder: jest.Mocked<Partial<SelectQueryBuilder<TestEntity>>>;

  const mockEntity: TestEntity = {
    id: 'entity-123',
    name: 'Test Entity',
  };

  beforeEach(() => {
    queryBuilder = {
      whereInIds: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    repository = {
      save: jest.fn(),
      exists: jest.fn(),
      findBy: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      hasId: jest.fn(),
      metadata: { name: 'TestEntity' } as any,
    };

    service = new TestService(repository as unknown as Repository<TestEntity>);
  });

  describe('exists', () => {
    it('should return true when entity exists', async () => {
      repository.exists.mockResolvedValue(true);

      const result = await service.exists({ id: 'entity-123' });

      expect(result).toBe(true);
    });

    it('should return false when entity does not exist', async () => {
      repository.exists.mockResolvedValue(false);

      const result = await service.exists({ id: 'unknown' });

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create entity successfully', async () => {
      repository.save.mockResolvedValue(mockEntity);

      const result = await service.create({ name: 'Test Entity' });

      expect(result).toEqual(mockEntity);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw AlreadyExistsError on duplicate key (code 23505)', async () => {
      const duplicateError = { code: '23505' };
      repository.save.mockRejectedValue(duplicateError);

      await expect(service.create({ name: 'Duplicate' })).rejects.toThrow(
        AlreadyExistsError,
      );
    });

    it('should rethrow other errors', async () => {
      const genericError = new Error('DB Error');
      repository.save.mockRejectedValue(genericError);

      await expect(service.create({ name: 'Test' })).rejects.toThrow(
        'DB Error',
      );
    });
  });

  describe('createMany', () => {
    it('should create multiple entities successfully', async () => {
      const entities = [mockEntity, { ...mockEntity, id: 'entity-456' }];
      repository.save.mockResolvedValue(entities as any);

      const result = await service.createMany([
        { name: 'Entity 1' },
        { name: 'Entity 2' },
      ]);

      expect(result).toHaveLength(2);
    });

    it('should throw AlreadyExistsError on duplicate key', async () => {
      repository.save.mockRejectedValue({ code: '23505' });

      await expect(service.createMany([{ name: 'Dup' }])).rejects.toThrow(
        AlreadyExistsError,
      );
    });
  });

  describe('readOne', () => {
    it('should return entity when found', async () => {
      queryBuilder.getOne.mockResolvedValue(mockEntity);

      const result = await service.readOne('entity-123');

      expect(result).toEqual(mockEntity);
      expect(queryBuilder.whereInIds).toHaveBeenCalledWith('entity-123');
    });

    it('should throw NotFoundError when not found', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.readOne('unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update entity successfully', async () => {
      const updatedEntity = { ...mockEntity, name: 'Updated' };
      queryBuilder.getOne.mockResolvedValue(mockEntity);
      repository.hasId.mockReturnValue(false);
      repository.save.mockResolvedValue(updatedEntity);

      const result = await service.update('entity-123', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw Error when id is in input', async () => {
      repository.hasId.mockReturnValue(true);

      await expect(
        service.update('entity-123', { id: 'new-id', name: 'Test' }),
      ).rejects.toThrow('Could not specify id in update input!');
    });

    it('should throw NotFoundError when entity not found', async () => {
      repository.hasId.mockReturnValue(false);
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.update('unknown', { name: 'Test' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('should delete entity successfully', async () => {
      const removedEntity = { ...mockEntity };
      delete (removedEntity as any).id;
      queryBuilder.getOne.mockResolvedValue(mockEntity);
      repository.remove.mockResolvedValue(removedEntity);

      const result = await service.delete('entity-123');

      expect(result.id).toBe('entity-123');
      expect(repository.remove).toHaveBeenCalledWith(mockEntity);
    });

    it('should throw NotFoundError when entity not found', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.delete('unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple entities', async () => {
      const entities = [mockEntity, { id: 'entity-456', name: 'Entity 2' }];
      repository.findBy.mockResolvedValue(entities);
      repository.remove.mockResolvedValue(entities as any);

      const result = await service.deleteMany(['entity-123', 'entity-456']);

      expect(result).toHaveLength(2);
    });
  });
});
