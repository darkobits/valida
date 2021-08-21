import type { Options as DeepMergeOptions } from 'deepmerge';
import type { Ow, Predicate } from 'ow';
import type { DeepPartial } from 'ts-essentials';

/**
 * Generic version of the `Shape` type.
 */
export type ShapeFor<T extends Record<string, any>> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends object
    ? (ShapeFor<T[K]> | Predicate<T[K]>)
    : Predicate<WidenLiterals<T[K]>> | ShapeFor<T[K]>
};


/**
 * Object passed to a SpecFn.
 */
export interface CreateValidatorContext {
  ow: Ow;
}


/**
 * Object returned by a SpecFn.
 */
export interface CreateValidatorOptions<T> {
  spec: ShapeFor<T>;
  defaults?: DeepPartial<T>;
  arrayMerge?: (target: Array<any>, source: Array<any>, options?: DeepMergeOptions) => Array<any>;
}


/**
 * Function passed to `createValidator`.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type SpecFn<S extends object = object> = (context: CreateValidatorContext) => CreateValidatorOptions<S>;


/**
 * Provided a type such as 'foo' | 'bar' | 'baz', widens it to 'string'.
 */
export type WidenLiterals<T> =
  T extends boolean ? boolean :
  T extends string ? string :
  T extends number ? number :
  T;
