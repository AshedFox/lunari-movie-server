import { Type } from '@nestjs/common';
import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type as TypeDecorator } from 'class-transformer';
import { Filterable, FilterType } from '../filter';
import { Sortable, SortType } from '../sort';
import { ArgsType as AT, OffsetArgsType, RelayArgsType } from './args.type';
import { InferPaginationType, PaginationVariant } from '../pagination';
import { ArgsStorage } from './args-storage';

export function GqlArgs<
  T,
  P extends PaginationVariant = 'take-skip',
  PT = InferPaginationType<P>,
>(classRef: Type<T>, paginationVariant?: P) {
  const ExistingArgs = ArgsStorage.get(
    `${classRef.name}_${paginationVariant ?? 'take-skip'}`,
  );

  if (ExistingArgs) {
    return ExistingArgs as Type<AT<T> & PT>;
  }

  const FT = Filterable(classRef);
  const ST = Sortable(classRef);

  if (!paginationVariant || paginationVariant === 'take-skip') {
    @ArgsType()
    class GqlArgs implements OffsetArgsType<T> {
      @ValidateNested()
      @Field(() => ST, { nullable: true })
      @TypeDecorator(() => ST)
      sort?: SortType<T>;
      @ValidateNested()
      @Field(() => FT, { nullable: true })
      @TypeDecorator(() => FT)
      filter?: FilterType<T>;
      @Field(() => Int, { defaultValue: 0 })
      @Min(0)
      offset: number;
      @Field(() => Int, { defaultValue: 20 })
      @Min(1)
      @Max(1000)
      limit: number;
    }

    ArgsStorage.set(
      `${classRef.name}_${paginationVariant ?? 'take-skip'}`,
      GqlArgs,
    );

    return GqlArgs as unknown as Type<AT<T> & PT>;
  } else if (paginationVariant === 'relay') {
    @ArgsType()
    class GqlArgs implements RelayArgsType<T> {
      @ValidateNested()
      @Field(() => ST, { nullable: true })
      @TypeDecorator(() => ST)
      sort?: SortType<T>;
      @ValidateNested()
      @Field(() => FT, { nullable: true })
      @TypeDecorator(() => FT)
      filter?: FilterType<T>;
      @Field(() => Int, { nullable: true })
      @IsPositive()
      @IsOptional()
      first?: number;
      @Field({ nullable: true })
      @IsOptional()
      after?: string;
      @Field(() => Int, { nullable: true })
      @IsPositive()
      @IsOptional()
      last?: number;
      @Field({ nullable: true })
      @IsOptional()
      before?: string;
    }
    ArgsStorage.set(`${classRef.name}_${paginationVariant}`, GqlArgs);

    return GqlArgs as Type<AT<T> & PT>;
  } else {
    @ArgsType()
    class GqlArgs {
      @ValidateNested()
      @Field(() => ST, { nullable: true })
      @TypeDecorator(() => ST)
      sort?: SortType<T>;
      @ValidateNested()
      @Field(() => FT, { nullable: true })
      @TypeDecorator(() => FT)
      filter?: FilterType<T>;
    }

    ArgsStorage.set(`${classRef.name}_${paginationVariant}`, GqlArgs);

    return GqlArgs as Type<AT<T> & PT>;
  }
}
