import DataLoader, { BatchLoadFn } from 'dataloader';
import { Injectable, Type } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import crypto from 'crypto';
import { IndexType } from '@utils/types';
import { camelCase, snakeCase } from 'typeorm/util/StringUtils';
import { ArgsType } from '@common/args';
import { applyArgs } from '@common/typeorm-query-parser';
import { InjectEntityManager } from '@nestjs/typeorm';
import { PaginationArgsType } from '@common/pagination';
import { plainToInstance } from 'class-transformer';

type LoaderKey<K, T> = {
  id: K;
  args?: ArgsType<T>;
  pagination?: PaginationArgsType;
};

@Injectable()
export class DataLoaderFactory {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  private readonly loaders: Record<string, DataLoader<unknown, unknown>> = {};

  private makeParentQueryBuilder = <
    Child extends object,
    Parent extends object,
    ParentKey extends keyof Parent,
  >(
    ids: ParentKey[],
    ChildClass: Type<Child>,
    childKeyName: string,
    ParentClass: Type<Parent>,
    parentKeyName: string,
    args?: ArgsType<any>,
    pagination?: PaginationArgsType,
    relationFieldName?: string,
  ): SelectQueryBuilder<Parent> => {
    const childQb = this.entityManager
      .createQueryBuilder()
      .select('"c".*')
      .from(ChildClass, 'c')
      .where(`"c".${childKeyName}="p".${parentKeyName}`);

    if (relationFieldName) {
      childQb.innerJoinAndSelect(`c.${relationFieldName}`, 'r');
      if (args || pagination) {
        applyArgs(childQb, args ?? {}, pagination, 'r');
      }
    } else {
      applyArgs(childQb, args ?? {}, pagination, 'c');
    }

    return this.entityManager
      .createQueryBuilder()
      .select('"t".*')
      .from(ParentClass, 'p')
      .innerJoin(
        (qb) => {
          qb.getQuery = () => `LATERAL (${childQb.getQuery()})`;
          qb.setParameters(childQb.getParameters());
          return qb;
        },
        't',
        'TRUE',
      )
      .where(`"p".${parentKeyName} IN (:...ids)`, { ids });
  };

  private createMultipleRelationBatchFn<
    Child extends object,
    ChildKey extends keyof Child,
    Parent extends object,
    ParentKey extends keyof Parent,
    RelationKey extends keyof Child,
    Relation extends Child[RelationKey],
  >(
    ChildClass: Type<Child>,
    childKeyName: ChildKey,
    ParentClass: Type<Parent>,
    parentKeyName: ParentKey,
    relationFieldName: RelationKey,
    RelationClass: Type<Relation>,
  ): BatchLoadFn<LoaderKey<ParentKey, Relation>, Relation[]> {
    const entityKey = String(childKeyName);
    const relationKey = String(relationFieldName);
    const parentKey = String(parentKeyName);

    return async (keys) => {
      const map: Record<IndexType, Relation[]> = {};
      const { args, pagination } = keys[0];
      const ids = keys.map((key) => key.id);

      let data: Child[];

      if (args || pagination) {
        data = await this.makeParentQueryBuilder(
          ids,
          ChildClass,
          snakeCase(entityKey),
          ParentClass,
          snakeCase(parentKey),
          args,
          pagination,
          relationKey,
        ).getRawMany();
      } else {
        data = await this.entityManager
          .createQueryBuilder()
          .select('"c".*')
          .from(ChildClass, 'c')
          .innerJoinAndSelect(`c.${relationKey}`, 'r')
          .where(`"c".${snakeCase(entityKey)} IN (:...ids)`, {
            ids,
          })
          .getRawMany();
      }

      for (const v of data) {
        const result = plainToInstance(ChildClass, {});
        result[relationKey] = plainToInstance(RelationClass, {});

        for (const [key, value] of Object.entries(v)) {
          if (key.startsWith('r_')) {
            result[relationKey][camelCase(key.slice(2))] = value;
          } else {
            result[camelCase(key)] = value;
          }
        }

        const id = result[entityKey];
        if (!map[id]) {
          map[result[entityKey]] = [];
        }
        map[id].push(result[relationKey]);
      }

      return ids.map((id) => map[id] ?? []);
    };
  }

  private createMultipleBatchFn<
    Child extends object,
    ChildKey extends keyof Child,
    Parent extends object,
    ParentKey extends keyof Parent,
  >(
    ChildClass: Type<Child>,
    childKeyName: ChildKey,
    ParentClass: Type<Parent>,
    parentKeyName: ParentKey,
  ): BatchLoadFn<LoaderKey<ParentKey, Child>, Child[]> {
    const entityKey = String(childKeyName);
    const parentKey = String(parentKeyName);

    return async (keys) => {
      const map: Record<IndexType, Child[]> = {};
      const { args, pagination } = keys[0];
      const ids = keys.map((key) => key.id);

      let data: Child[];

      if (args || pagination) {
        data = await this.makeParentQueryBuilder(
          ids,
          ChildClass,
          snakeCase(entityKey),
          ParentClass,
          snakeCase(parentKey),
          args,
          pagination,
        ).getRawMany();
      } else {
        data = await this.entityManager
          .createQueryBuilder()
          .select(`"c".*`)
          .from(ChildClass, 'c')
          .where(`"c".${snakeCase(entityKey)} IN (:...ids)`, {
            ids,
          })
          .getRawMany<Child>();
      }

      for (const v of data) {
        const result = plainToInstance(ChildClass, {});

        for (const [key, value] of Object.entries(v)) {
          result[camelCase(key)] = value;
        }

        const id = result[entityKey];
        if (!map[id]) {
          map[result[entityKey]] = [];
        }
        map[result[entityKey]].push(result);
      }

      return ids.map((id) => map[id] ?? []);
    };
  }

  private createBatchFn<Entity extends object, Key extends keyof Entity>(
    EntityClass: Type<Entity>,
    keyName: Key,
  ): BatchLoadFn<Key, Entity> {
    const key = String(keyName);

    return async (ids) => {
      const map: Record<IndexType, Entity> = {};

      const data = await this.entityManager
        .createQueryBuilder(EntityClass, 't')
        .whereInIds(ids)
        .getMany();

      for (const v of data) {
        map[v[key]] = v;
      }

      return ids.map((id) => map[id] ?? null);
    };
  }

  private hashKey(key: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(key))
      .digest('hex')
      .toString();
  }

  createOrGetLoader<Entity extends object, Key extends keyof Entity>(
    EntityClass: Type<Entity>,
    keyName: Key,
  ): DataLoader<Entity[Key], Entity>;
  createOrGetLoader<
    Child extends object,
    ChildKey extends keyof Child,
    Parent extends object,
    ParentKey extends keyof Parent,
  >(
    ChildClass: Type<Child>,
    childKeyName: ChildKey,
    ParentClass: Type<Parent>,
    parentKeyName: ParentKey,
  ): DataLoader<LoaderKey<Parent[ParentKey], Child>, Child[], string>;
  createOrGetLoader<
    Child extends object,
    ChildKey extends keyof Child,
    Parent extends object,
    ParentKey extends keyof Parent,
    RelationKey extends keyof Child,
    Relation extends Child[RelationKey],
  >(
    ChildClass: Type<Child>,
    childKeyName: ChildKey,
    ParentClass: Type<Parent>,
    parentKeyName: ParentKey,
    relationFieldName: RelationKey,
    RelationClass: Type<Relation>,
  ): DataLoader<LoaderKey<Parent[ParentKey], Relation>, Relation[], string>;
  createOrGetLoader<
    ChildOrEntity extends object,
    ChildOrEntityKey extends keyof ChildOrEntity,
    Parent extends object,
    ParentKey extends keyof Parent,
    RelationKey extends keyof ChildOrEntity,
    Relation extends ChildOrEntity[RelationKey],
  >(
    ChildOrEntityClass: Type<ChildOrEntity>,
    childOrEntityKeyName: ChildOrEntityKey,
    ParentClass?: Type<Parent>,
    parentKeyName?: ParentKey,
    relationFieldName?: RelationKey,
    RelationClass?: Type<Relation>,
  ): DataLoader<unknown, unknown> {
    let loaderName: string;

    if (parentKeyName && ParentClass && relationFieldName && RelationClass) {
      loaderName =
        ParentClass.name +
        parentKeyName.toString() +
        ChildOrEntityClass +
        childOrEntityKeyName.toString() +
        RelationClass.name +
        relationFieldName.toString();

      if (!this.loaders[loaderName]) {
        this.loaders[loaderName] = new DataLoader(
          this.createMultipleRelationBatchFn(
            ChildOrEntityClass,
            childOrEntityKeyName,
            ParentClass,
            parentKeyName,
            relationFieldName,
            RelationClass,
          ),
          { cacheKeyFn: this.hashKey },
        );
      }
    } else if (parentKeyName && ParentClass) {
      loaderName =
        ParentClass.name +
        parentKeyName.toString() +
        ChildOrEntityClass +
        childOrEntityKeyName.toString();

      if (!this.loaders[loaderName]) {
        this.loaders[loaderName] = new DataLoader(
          this.createMultipleBatchFn(
            ChildOrEntityClass,
            childOrEntityKeyName,
            ParentClass,
            parentKeyName,
          ),
          { cacheKeyFn: this.hashKey },
        );
      }
    } else {
      loaderName = ChildOrEntityClass + childOrEntityKeyName.toString();

      if (!this.loaders[loaderName]) {
        this.loaders[loaderName] = new DataLoader(
          this.createBatchFn(ChildOrEntityClass, childOrEntityKeyName),
        );
      }
    }

    return this.loaders[loaderName];
  }

  createOrGetCountLoader<
    Entity extends object,
    GroupKey extends keyof Entity,
    CountKey extends keyof Entity,
  >(
    EntityClass: Type<Entity>,
    groupKey: GroupKey,
    countKey: CountKey,
    extra?: (qb: SelectQueryBuilder<Entity>) => void,
  ): DataLoader<Entity[GroupKey], number> {
    const groupKeyName = String(groupKey);
    const countKeyName = String(countKey);
    const loaderName = `count_${EntityClass.name}_${groupKeyName}_${countKeyName}`;

    if (!this.loaders[loaderName]) {
      this.loaders[loaderName] = new DataLoader<Entity[GroupKey], number>(
        async (keys) => {
          const map: { [key: string]: number } = {};
          const snakeGroupKeyName = snakeCase(groupKeyName);

          const qb = this.entityManager
            .createQueryBuilder(EntityClass, 't')
            .select(
              `${snakeGroupKeyName}, count(${snakeGroupKeyName}) as count`,
            )
            .groupBy(snakeGroupKeyName)
            .where(`${snakeGroupKeyName} IN (:...keys)`, { keys });

          extra?.(qb);

          const data = await qb.getRawMany();

          for (const row of data) {
            map[row[snakeGroupKeyName]] = row.count;
          }

          return keys.map((key) => map[key as string] ?? 0);
        },
      );
    }

    return this.loaders[loaderName] as DataLoader<Entity[GroupKey], number>;
  }
}
