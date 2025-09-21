import {
  EntityManager,
  EntityMetadata,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { FilterComparisonType, FilterType } from './filter';
import { PaginationArgsType } from './pagination';
import { SortDirectionEnum, SortType, SortVariant } from './sort';
import { ArgsType } from '@common/args';
import { OffsetPaginationArgsType } from './pagination/offset';
import { RelayPaginationArgsType } from './pagination/relay';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { snakeCase } from 'typeorm/util/StringUtils';

// FILTERS

type OperatorKey =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'nlike'
  | 'ilike'
  | 'nilike'
  | 'in'
  | 'nin'
  | 'btwn'
  | 'nbtwn';

type Operators = Record<
  OperatorKey,
  {
    withNull?: string;
    withValue?: string;
    valueTransform?: (value: any) => any;
  }
>;

const FILTER_OPERATORS: Operators = {
  eq: { withNull: 'IS NULL', withValue: '= :value' },
  neq: { withNull: 'IS NOT NULL', withValue: '!= :value' },
  gt: { withValue: '> :value' },
  gte: { withValue: '>= :value' },
  lt: { withValue: '< :value' },
  lte: { withValue: '<= :value' },
  like: { withValue: 'LIKE :value', valueTransform: (v) => `%${v}%` },
  nlike: { withValue: 'NOT LIKE :value', valueTransform: (v) => `%${v}%` },
  ilike: { withValue: 'ILIKE :value', valueTransform: (v) => `%${v}%` },
  nilike: { withValue: 'NOT ILIKE :value', valueTransform: (v) => `%${v}%` },
  in: { withValue: 'IN (:...value)' },
  nin: { withValue: 'NOT IN (:...value)' },
  btwn: {
    withValue: 'BETWEEN :startValue AND :endValue',
    valueTransform: (v) => ({ startValue: v.start, endValue: v.end }),
  },
  nbtwn: {
    withValue: 'NOT BETWEEN :startValue AND :endValue',
    valueTransform: (v) => ({ startValue: v.start, endValue: v.end }),
  },
};

const constructFieldFilter = (
  operator: OperatorKey,
  operand: unknown,
  fieldName: string,
  alias: string,
): {
  where: string;
  params?: ObjectLiteral;
} => {
  const filterOperator = FILTER_OPERATORS[operator];
  const name = randomStringGenerator();

  if (operand === null) {
    if (filterOperator.withNull) {
      return { where: `${alias}.${fieldName} ${filterOperator.withNull}` };
    }
    return;
  }

  if (filterOperator.withValue) {
    const transformedValue = filterOperator.valueTransform
      ? filterOperator.valueTransform(operand)
      : operand;

    if (operator === 'btwn' || operator === 'nbtwn') {
      return {
        where: `${alias}.${fieldName} ${filterOperator.withValue}`,
        params: {
          [`${name}${operator}Start`]: transformedValue.startValue,
          [`${name}${operator}End`]: transformedValue.endValue,
        },
      };
    } else if (operator === 'nin' || operator === 'in') {
      const paramName = `${name}${operator}Value`;
      const withValue = filterOperator.withValue.replace(
        ':...value',
        `:...${paramName}`,
      );
      return {
        where: `${alias}.${fieldName} ${withValue}`,
        params: {
          [paramName]: transformedValue,
        },
      };
    } else {
      const paramName = `${name}${operator}Value`;
      const withValue = filterOperator.withValue.replace(
        ':value',
        `:${paramName}`,
      );
      return {
        where: `${alias}.${fieldName} ${withValue}`,
        params: {
          [paramName]: transformedValue,
        },
      };
    }
  }
};

function applyFilters<T>(
  qb: SelectQueryBuilder<T>,
  filter: FilterType<T>,
  alias: string,
  scope: 'and' | 'or' = 'and',
  entityManager?: EntityManager,
  metadata?: EntityMetadata,
) {
  for (const key in filter) {
    if (key === 'and' || key === 'or') {
      for (const nestedKey in filter[key]) {
        applyFilters(
          qb,
          filter[key][nestedKey],
          alias,
          key,
          entityManager,
          metadata,
        );
      }
    } else {
      const value = filter[key] as FilterComparisonType<any>;

      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (FILTER_OPERATORS[nestedKey]) {
          const { where, params } = constructFieldFilter(
            nestedKey as OperatorKey,
            nestedValue,
            key,
            alias,
          );
          if (scope === 'and') {
            qb.andWhere(where, params);
          } else if (scope === 'or') {
            qb.orWhere(where, params);
          }
        } else if (metadata && entityManager) {
          const relation = metadata.relations.find(
            (rel) => rel.propertyName === key,
          );

          if (relation) {
            const newAlias = `${alias}_${key}`;
            if (
              !qb.expressionMap.joinAttributes.some(
                (join) => join.alias.name === newAlias,
              )
            ) {
              qb.leftJoin(`${alias}.${relation.propertyName}`, newAlias);
            }
            const newMetadata = entityManager.connection.getMetadata(
              relation.type,
            );

            applyFilters(
              qb,
              value,
              newAlias,
              scope,
              entityManager,
              newMetadata,
            );
          }
        }
      }
    }
  }
}

// PAGIANATION

const applyOffsetPagination = <T>(
  qb: SelectQueryBuilder<T>,
  pagination: OffsetPaginationArgsType,
) => {
  qb.limit(pagination.limit).offset(pagination.offset);
};

const applyRelayPagination = <T>(
  qb: SelectQueryBuilder<T>,
  pagination: RelayPaginationArgsType,
  alias: string,
) => {
  const { first, last, before, after } = pagination;
  const idFieldName = alias ? `${alias}.id` : `id`;

  if (first) {
    if (after) {
      qb.andWhere(`${idFieldName} > :after`, { after });
    }
    qb.addOrderBy(idFieldName, 'ASC').limit(first + 1);
  } else if (last) {
    if (before) {
      qb.andWhere(`${idFieldName} < :before`, { before });
    }
    qb.addOrderBy(idFieldName, 'DESC').limit(last + 1);
  }
};

const applyPagination = <T>(
  qb: SelectQueryBuilder<T>,
  pagination: PaginationArgsType,
  alias: string,
) => {
  if ('offset' in pagination) {
    applyOffsetPagination(qb, pagination);
  } else {
    applyRelayPagination(qb, pagination, alias);
  }
};

// SORT

const applyFieldSort = <T>(
  qb: SelectQueryBuilder<any>,
  fieldName: string,
  variant: SortVariant<T>,
  alias: string,
  entityManager?: EntityManager,
  metadata?: EntityMetadata,
) => {
  if (!('direction' in variant)) {
    if (entityManager && metadata) {
      const relation = metadata.relations.find(
        (rel) => rel.propertyName === fieldName,
      );

      if (relation) {
        const newAlias = `${alias}_${fieldName}`;
        if (
          !qb.expressionMap.joinAttributes.some(
            (join) => join.alias.name === newAlias,
          )
        ) {
          qb.leftJoin(`${alias}.${relation.propertyName}`, newAlias);
        }
        const newMetadata = entityManager.connection.getMetadata(relation.type);

        for (const key in variant) {
          applyFieldSort(
            qb,
            key,
            variant[key],
            newAlias,
            entityManager,
            newMetadata,
          );
        }
      }
    }
    return;
  }

  const direction = variant.direction?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const nulls =
    variant.nulls?.toUpperCase() === 'FIRST'
      ? 'NULLS FIRST'
      : variant.nulls?.toUpperCase() === 'LAST'
        ? 'NULLS LAST'
        : undefined;

  qb.addOrderBy(`"${alias}"."${snakeCase(fieldName)}"`, direction, nulls);
};

const applySort = <T>(
  qb: SelectQueryBuilder<T>,
  sort: SortType<T>,
  alias: string,
  entityManager?: EntityManager,
  metadata?: EntityMetadata,
) => {
  const sortKeys = Object.keys(sort);
  const primaryColumns = metadata
    ? metadata.primaryColumns.filter(
        (value) => !sortKeys.includes(value.propertyName),
      )
    : [{ propertyName: 'id' }];

  for (const key of sortKeys) {
    applyFieldSort(qb, key, sort[key], alias, entityManager, metadata);
  }

  for (const primaryColumn of primaryColumns) {
    applyFieldSort(
      qb,
      primaryColumn.propertyName,
      { direction: SortDirectionEnum.ASC },
      alias,
    );
  }
};

/**
 * Get count with filter (if passed)
 * @param repo Repository of the entity for which the args are specified
 * @param filter Filter parameters
 * @returns Count
 */
export function getCount<T>(
  repo: Repository<T>,
  filter?: FilterType<T>,
): Promise<number> {
  const entityManager = repo.manager;
  const qb = repo.createQueryBuilder(repo.metadata.name);

  if (filter) {
    applyFilters(qb, filter, qb.alias, 'and', entityManager, repo.metadata);
  }

  return qb.getCount();
}

// DISTINCT ON

function constructDistinctOn<T>(sort: SortType<T>, alias: string): Set<string> {
  const distinctOn = new Set<string>();

  for (const key in sort) {
    if ('direction' in sort[key]) {
      distinctOn.add(`${alias}.${key}`);
    } else {
      const nestedDistinctOn = constructDistinctOn(
        sort[key],
        `${alias}_${key}`,
      );

      for (const value of nestedDistinctOn) {
        distinctOn.add(value);
      }
    }
  }

  return distinctOn;
}

function applyDistinctOn<T>(
  qb: SelectQueryBuilder<T>,
  sort: SortType<T> = {},
  alias: string,
  metadata: EntityMetadata,
) {
  const distinctOn = constructDistinctOn(sort, alias);

  for (const primaryColumn of metadata.primaryColumns) {
    distinctOn.add(`${alias}.${primaryColumn.propertyName}`);
  }

  qb.distinctOn([...distinctOn]);
}

/**
 * Parse query args (pagination, sort and filters) to typeorm query builder
 * @param repo Repository of the entity for which the args are specified
 * @param pagination Pagination parameters (offset or relay pagination)
 * @param sort Sort parameters
 * @param filter Filter parameters
 * @returns Entites with applied args
 */
export function getMany<T>(
  repo: Repository<T>,
  pagination?: PaginationArgsType,
  sort?: SortType<T>,
  filter?: FilterType<T>,
): Promise<T[]> {
  const entityManager = repo.manager;
  const qb = repo.createQueryBuilder(repo.metadata.name);

  applyDistinctOn(qb, sort, qb.alias, repo.metadata);
  applySort(qb, sort ?? {}, qb.alias, entityManager, repo.metadata);

  if (filter) {
    applyFilters(qb, filter, qb.alias, 'and', entityManager, repo.metadata);
  }

  if (pagination) {
    applyPagination(qb, pagination, qb.alias);
  }

  return qb.getMany();
}

/**
 * Parse query args (pagination, sort and filters) to typeorm query builder
 * @param qb Query builder to apply args to
 * @param args Args (sort and filters)
 * @param pagination Pagination parameters (offset or relay pagination)
 * @param alias Base alias for query builder
 * @returns Passed query builder with applied pagination, sort and filters
 */
export function applyArgs<T>(
  repo: Repository<T>,
  qb: SelectQueryBuilder<T>,
  args: ArgsType<T>,
  pagination?: PaginationArgsType,
  alias?: string,
): SelectQueryBuilder<T> {
  const { filter, sort } = args;
  const entityManager = repo.manager;

  if (sort) {
    applySort(qb, sort, alias ?? qb.alias, entityManager, repo.metadata);
  }

  if (pagination) {
    applyPagination(qb, pagination, alias ?? qb.alias);
  }
  if (filter) {
    applyFilters(
      qb,
      filter,
      alias ?? qb.alias,
      'and',
      entityManager,
      repo.metadata,
    );
  }

  return qb;
}
