import { Sortable } from './sortable.helper';
import { ObjectType, Field } from '@nestjs/graphql';
import { FilterableField } from '../filter';

@ObjectType()
class TestEntity {
  @Field()
  @FilterableField()
  name: string;
}

describe('Sortable Helper', () => {
  it('should create a Sort class for an entity', () => {
    const SortClass = Sortable(TestEntity);
    expect(SortClass).toBeDefined();

    const instance = new SortClass();
    expect(instance).toBeDefined();
  });

  it('should cache generated classes', () => {
    const SortClass1 = Sortable(TestEntity);
    const SortClass2 = Sortable(TestEntity);
    expect(SortClass1).toBe(SortClass2);
  });
});
