import { Predicate, BasePredicate } from 'ow';

import type {
  Constructor,
  MethodDecorator,
  MethodType,
  Prototype
} from 'etc/types';


/**
 * Provided an error, formats its message and returns it.
 */
export function formatMessage(err: any) {
  if (!err || typeof err.stack !== 'string') return;

  return err.message.split('\n').map((line: string) => {
    if (line.endsWith(':') || line.endsWith('.')) {
      return line;
    }

    return `${line}.`;
  }).join('\n') as string;
}


/**
 * Returns `true` if the provided value is an instance of Predicate.
 */
export function isPredicate(value: any): value is BasePredicate {
  return value instanceof Predicate;
}


/**
 * Decorates the indicated class method using the provided function.
 */
export function decorateMethod<C extends Constructor<any>, M extends keyof C | keyof Prototype<C>>(ctor: C, methodName: M, decorator: MethodDecorator<C, M>) {
  const originalMethod = ctor.prototype[methodName];
  ctor.prototype[methodName] = function(this: Prototype<C>, ...args: Parameters<MethodType<C, M>>) {
    return decorator({ args, method: originalMethod.bind(this), instance: this });
  };
}
