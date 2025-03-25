import { Type } from '@nestjs/common';
import { Field, InputType, TypeMetadataStorage } from '@nestjs/graphql';
import { capitalize } from '@utils/helpers';
import {
  FilterableRelationMetadata,
  getFilterableFields,
  getFilterableRelations,
} from '../filter';
import { SortType } from './sort.type';
import { SortOptions } from './sort-options.type';
import { SortStorage } from '@common/sort/sort-storage';

export function Sortable<T>(classRef: Type<T>) {
  const filterableRelations = getFilterableRelations(classRef);

  const name = (
    TypeMetadataStorage.getObjectTypeMetadataByTarget(classRef) ??
    TypeMetadataStorage.getInterfaceMetadataByTarget(classRef)
  ).name;

  return createSortableType(
    classRef,
    `${capitalize(name)}Sort`,
    0,
    filterableRelations,
  );
}

function createSortableType<T>(
  classRef: Type<T>,
  name: string,
  level: number,
  relations?: FilterableRelationMetadata[],
) {
  const ExistingSort = SortStorage.get(name);

  if (ExistingSort) {
    return ExistingSort as Type<SortType<T>>;
  }

  const filterableFields = getFilterableFields(classRef);

  if (filterableFields.length === 0 && relations?.length === 0) {
    throw new Error(`No sortable fields or relations in ${classRef}`);
  }

  @InputType(name)
  class GqlSort {}

  filterableFields.forEach(({ propertyKey }) => {
    Field(() => SortOptions, { nullable: true })(
      GqlSort.prototype,
      propertyKey,
    );
  });
  if (level <= 5) {
    relations?.forEach(
      ({ returnTypeFunction, propertyKey, advancedOptions }) => {
        if (!returnTypeFunction) {
          throw new Error(
            `No explicit type for sortable relation ${propertyKey} in ${classRef}`,
          );
        }

        const returnType = returnTypeFunction();
        const type = Array.isArray(returnType)
          ? (returnType[0] as Type)
          : (returnType as Type);

        const ST = createSortableType(
          type,
          `${capitalize(advancedOptions?.name ?? type.name)}_${name}`,
          level + 1,
          getFilterableRelations(type),
        );

        Field(() => ST, { nullable: true })(GqlSort.prototype, propertyKey);
      },
    );
  }

  SortStorage.set(name, GqlSort);
  return GqlSort as Type<SortType<T>>;
}
