import type { Options as DeepMergeOptions } from 'deepmerge';
import type { Ow, BasePredicate, Predicate, NumberPredicate } from 'ow';
import type { DeepPartial } from 'ts-essentials';


/**
 * Infer the type of a generic predicate.
 */
export type Infer<T> = T extends BasePredicate<infer P> ? P : T;

export type Deduce<T> = T extends BasePredicate<infer P> ? BasePredicate<P> : T;


export type InferDeep<T> = {
  [K in keyof T]: T[K] extends BasePredicate<infer P>
    ? P
    : T[K] extends object
      ? InferDeep<T[K]>
      : T[K];
};


export type DeduceDeep<T> = {
  [K in keyof T]: T[K] extends BasePredicate<infer P>
    ? BasePredicate<P>
    : T[K] extends object
      ? DeduceDeep<T[K]>
      : T[K];
};

type UnwrapMe = NumberPredicate & BasePredicate<number | undefined>;

type Foo = Infer<UnwrapMe>;


/**
 * Generic (imperfect) version of the `Shape` type from `ow`.
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
export interface CreateValidatorOptions<T extends object = object> {
  /**
   * Optionally provide a descriptive name for the object being validated. This
   * will be used as an `ow` label.
   */
  name?: string;
  spec: DeduceDeep<T>;
  defaults?: InferDeep<T>;
  arrayMerge?: (target: Array<any>, source: Array<any>, options?: DeepMergeOptions) => Array<any>;
}


/**
 * Function passed to `createValidator`.
 */
export type SpecFn<S extends object = object> = (context: CreateValidatorContext) => CreateValidatorOptions<S>;


/**
 * Provided a type such as 'foo' | 'bar' | 'baz', widens it to 'string'.
 */
export type WidenLiterals<T> =
  T extends boolean ? boolean :
  T extends string ? string :
  T extends number ? number :
  T;
