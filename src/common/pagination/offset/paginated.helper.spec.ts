import { Paginated } from './paginated.helper';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class TestEntity {
  @Field()
  id: string;
}

describe('Paginated Helper', () => {
  it('should create a Paginated class for an entity', () => {
    const PaginatedClass = Paginated(TestEntity);
    expect(PaginatedClass).toBeDefined();

    const instance = new PaginatedClass();
    expect(instance).toBeDefined();
    expect(instance.nodes).toBeUndefined();
    expect(instance.pageInfo).toBeUndefined();
  });
});
