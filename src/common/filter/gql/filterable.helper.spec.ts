import { Filterable } from './filterable.helper';
import { ObjectType, Field } from '@nestjs/graphql';
import { FilterableField } from '../../filter';

@ObjectType()
class TestEntity {
  @Field()
  @FilterableField()
  name: string;
}

describe('Filterable Helper', () => {
  it('should create a Filter class for an entity', () => {
    const FilterClass = Filterable(TestEntity);
    expect(FilterClass).toBeDefined();

    const instance = new FilterClass();
    expect(instance).toBeDefined();
  });

  it('should cache generated classes', () => {
    const FilterClass1 = Filterable(TestEntity);
    const FilterClass2 = Filterable(TestEntity);
    expect(FilterClass1).toBe(FilterClass2);
  });
});
