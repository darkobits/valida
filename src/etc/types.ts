import type { Options as DeepMergeOptions } from 'deepmerge';
import type { Ow, BasePredicate } from 'ow';
import type {
  DeepPartial,
  DeepRequired,
  Exact,
  Merge,
  NonEmptyObject
} from 'ts-essentials';


// ----- Decorator-Related -----------------------------------------------------

/**
 * Optional array merging function. Forwarded to `deepmerge`.
 */
export type ArrayMerge = (target: Array<any>, source: Array<any>, options?: DeepMergeOptions) => Array<any>;


/**
 * Represents a generic class constructor.
 */
export type Constructor<T> = new (...args: Array<any>) => T;


/**
 * Provided a Constructor type, unwraps its prototype / instance type.
 */
export type Prototype<C> = C extends Constructor<infer P> ? P : never;


/**
 * Provided a Constructor or Prototype and a method name, returns the type for
 * that method.
 */
export type MethodType<
  C extends Constructor<any> | Prototype<any>,
  K extends (keyof Prototype<C> | keyof C)
> = C extends Constructor<any>
  ? K extends keyof Prototype<C>
    ? Prototype<C>[K] extends (this: Prototype<C>, ...args: Array<any>) => any
      ? Prototype<C>[K]
      : never
    : never
  : C extends Prototype<any>
    ? K extends keyof C
      ? C[K] extends (this: Prototype<C>, ...args: Array<any>) => any
        ? C[K]
        : never
      : never
    : never;


/**
 * Object passed to method decorators.
 */
export interface MethodDecoratorContext<C extends Constructor<any>, K extends keyof Prototype<C>> {
  args: Parameters<MethodType<C, K>>;
  method: MethodType<C, K>;
  instance: Prototype<C>;
}


/**
 * Signature of method decorators.
 */
export type MethodDecorator<C extends Constructor<any>, K extends keyof Prototype<C>> = (ctx: MethodDecoratorContext<C, K>) => ReturnType<MethodType<C, K>>;


// ----- ow-Related ------------------------------------------------------------

/**
 * Defines an object with zero keys.
 */
export type EmptyObject<T extends {}> = keyof T extends never ? T : never;


/**
 * Provided a type such as 'foo' | 'bar' | 'baz', widens it to 'string'. This
 * is needed to ensure that predicates like ow.string are valid for narrow type
 * literals.
 */
export type WidenLiterals<T> =
 T extends boolean ? boolean :
 T extends string ? string :
 T extends number ? number :
 T;


/**
 * Deeply wraps a type into predicates.
 */
export type PredicateFor<T> = T extends BasePredicate<infer U>
  ? BasePredicate<U>
  : BasePredicate<T>;


/**
  * Deeply wraps a type into predicates. If the type is an object, maps its keys
  * into predicates while leaving the root intact.
  */
export type PredicateObjectFor<T> = T extends BasePredicate
  ? T
  : T extends object
    ? T extends NonEmptyObject<T>
      ? { [K in keyof T]: PredicateFor<T[K]>; }
      : never // empty object
    : BasePredicate<T>;


/**
  * Deeply unwraps a predicate type or predicate object type into its shape.
  */
export type ShapeFor<T> = T extends BasePredicate<infer P>
  ? P
  : { [K in keyof T]: ShapeFor<T[K]>; };


export type ValidationResult<T, D> = Exact<T, ShapeFor<T>> extends never
  // No type argument was used.
  ? Merge<ShapeFor<T>, DeepRequired<D>>
  // Type argument was used.
  : T;


/**
  * Deeply unwraps a predicate type into its generic shape, making each property
  * optional.
  */
export type DefaultsFor<T> = T extends object
  ? DeepPartial<ShapeFor<T>>
  : ShapeFor<T>;


// ----- Valida Options --------------------------------------------------------

/**
 * Object returned by a SpecFn.
 */
export interface CreateValidatorOptions<T, D> {
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
  defaults?: D;

  /**
   * Optional array merging function. Forwarded to `deepmerge`.
   */
  arrayMerge?: ArrayMerge;
}


/**
 * Object passed to a `SpecFn`.
 */
export interface CreateValidatorContext {
  ow: Ow;
}


/**
 * Function passed to `createValidator`.
 */
export type SpecFn<S, D> = (context: CreateValidatorContext) => CreateValidatorOptions<S, D>;


/**
 * Signature of validator functions.
 */
export type Validator<T, D> = (value: any) => ValidationResult<T, D>;
