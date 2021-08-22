import type { Options as DeepMergeOptions } from 'deepmerge';
import type { Ow, BasePredicate } from 'ow';
import type { DeepPartial } from 'ts-essentials';


/**
 * Deeply wraps a type into predicates.
 */
export type PredicateFor<T> = T extends BasePredicate ? T : BasePredicate<T>;


/**
 * Deeply wraps a type into predicates. If the type is an object, maps its keys
 * into predicates while leaving the root intact.
 *
 * @example
 *
 * type Kitten = {
 *   cute: boolean;
 * }
 *
 * type KittenPredicate = PredicateObjectFor<Kitten> //=> {
 *   cute: BasePredicate<boolean>;
 * }
 */
export type PredicateObjectFor<T> = T extends BasePredicate ? T : T extends object ? {
  // For each key in T, if the value is an object, recurse. Otherwise, wrap the
  // value in BasePredicate.
  [K in keyof T]: T[K] extends object ? PredicateFor<T[K]> : BasePredicate<T[K]>;
} : BasePredicate<T>;


/**
 * Deeply unwraps a predicate type or predicate object type into its shape.
 */
export type ShapeFor<T> = T extends BasePredicate<infer P> ? P : {
  // For each key in T, if the value is a BasePredicate, unwrap it. If the value
  // is an object, recurse. Otherwise, use the type as-is.
  [K in keyof T]: T[K] extends BasePredicate<infer P> ? P : T[K] extends object ? DefaultsFor<T[K]> : T[K];
};


/**
 * Deeply unwraps a predicate type into its generic shape, making each property
 * optional.
 */
export type DefaultsFor<T> = DeepPartial<ShapeFor<T>>;


/**
 * Object passed to a SpecFn.
 */
export interface CreateValidatorContext {
  ow: Ow;
}


/**
 * Optional array merging function. Forwarded to `deepmerge`.
 */
export type ArrayMerge = (target: Array<any>, source: Array<any>, options?: DeepMergeOptions) => Array<any>;


/**
 * Object returned by a SpecFn.
 */
export interface CreateValidatorOptions<T extends object = object> {
  /**
   * Optionally provide a descriptive name for the object being validated. This
   * will be used as an `ow` label.
   */
  name?: string;

  /**
   * Defines the intended shape for valid objects using `ow` predicates.
   *
   * Note: If the root value is a plain object, it will be wrapped in
   * `partialShape` by default. If your spec requires an exact shape, use
   * `exactShape` at the root.
   */
  spec: PredicateFor<T> | PredicateObjectFor<T>;

  /**
   * Optional defaults to merge into user-provided values before performing
   * validation.
   */
  defaults?: DefaultsFor<T>;

  /**
   * Optional array merging function. Forwarded to `deepmerge`.
   */
  arrayMerge?: ArrayMerge;
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
