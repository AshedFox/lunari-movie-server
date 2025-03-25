import { SortOptionsType } from './sort-options.type';

export type SortVariant<T> = T extends undefined
  ? undefined
  : T extends Promise<infer U>
    ? SortType<U>
    : T extends Array<infer U>
      ? SortType<U>
      : T extends object
        ? SortType<T>
        : SortOptionsType;

export type SortType<T> = {
  [P in keyof T]?: SortVariant<NonNullable<T[P]>>;
};
