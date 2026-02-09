import { Connection } from './connection.helper';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class TestNode {
  @Field()
  id: string;
}

@ObjectType()
class TestEdge {
  @Field()
  cursor: string;

  @Field(() => TestNode)
  node: TestNode;
}

describe('Connection Helper', () => {
  it('should create a Connection class for node and edge types', () => {
    const ConnectionClass = Connection(TestEdge, TestNode);
    expect(ConnectionClass).toBeDefined();

    const instance = new ConnectionClass();
    expect(instance).toBeDefined();
    expect(instance.edges).toBeUndefined();
    expect(instance.pageInfo).toBeUndefined();
  });
});
