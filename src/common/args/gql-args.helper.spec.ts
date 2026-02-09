import { GqlArgs } from './gql-args.helper';
import { ObjectType, Field } from '@nestjs/graphql';
import { FilterableField } from '../filter';

@ObjectType()
class TestEntity {
  @Field()
  @FilterableField()
  id: string;

  @Field()
  @FilterableField()
  name: string;
}

describe('GqlArgs Helper', () => {
  it('should create an Args class for an entity', () => {
    const ArgsClass = GqlArgs(TestEntity);
    expect(ArgsClass).toBeDefined();

    const instance = new ArgsClass();
    expect(instance).toBeDefined();
  });

  it('should cache generated classes', () => {
    const ArgsClass1 = GqlArgs(TestEntity);
    const ArgsClass2 = GqlArgs(TestEntity);
    expect(ArgsClass1).toBe(ArgsClass2);
  });
});
