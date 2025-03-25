import { OffsetPaginationArgs, OffsetPaginationArgsType } from './offset';
import { RelayPaginationArgs, RelayPaginationArgsType } from './relay';

export type InferPaginationType<P extends PaginationVariant> =
  P extends 'take-skip'
    ? OffsetPaginationArgs
    : P extends 'relay'
      ? RelayPaginationArgs
      : P extends 'none'
        ? object
        : never;

export type PaginationVariant = 'take-skip' | 'relay' | 'none';

export type PaginationArgsType =
  | OffsetPaginationArgsType
  | RelayPaginationArgsType;
