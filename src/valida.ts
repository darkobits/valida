import merge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';
import ow from 'ow';

import { decorateOw } from 'lib/decorate-ow';
import { formatMessage, isPredicate } from 'lib/utils';

import type { SpecFn, DefaultsFor, ValidationResult, Validator } from 'etc/types';


decorateOw();


/**
 * @private
 *
 * If the user did not configure a validator with an array merging function, the
 * default behavior is to favor the array value in the incoming object.
 */
function defaultArrayMerge(target: Array<any>, source: Array<any>) {
  return source ?? target;
}


/**
 * @private
 *
 * Invokes a user-provided spec function, applies defaults as needed, and
 * returns a configuration object.
 */
function getConfiguration<T, D>(specFn: SpecFn<T, D>) {
  try {
    ow(specFn, 'argument', ow.function);

    // Resolve options.
    const opts = specFn({ ow });

    // Validate options.
    ow(opts, 'valida options', ow.object.partialShape({
      spec: ow.object.not.empty
    }));

    const arrayMerge = opts.arrayMerge ?? defaultArrayMerge;
    const spec = isPredicate(opts.spec) ? opts.spec : ow.object.partialShape(opts.spec);

    // Validate inputs.
    ow(spec, 'spec', ow.object);
    // Skip validating defaults as ow does not support "deep" partialShape.
    // ow(opts.defaults, 'defaults', spec);
    ow(arrayMerge, 'arrayMerge', ow.function);

    return { name: opts.name, spec, arrayMerge, defaults: opts.defaults };
  } catch (err) {
    throw new TypeError(`[valida] Error creating validator: ${formatMessage(err)}`);
  }
}


/**
 * Accepts a function that should return a spec object. The function will be
 * passed an object containing a reference to `ow`.
 */
export default function createValidator<T, D = DefaultsFor<T>>(specFn: SpecFn<T, D>) {
  const { name, spec, defaults, arrayMerge } = getConfiguration(specFn);

  const validator: Validator<T, D> = input => {
    const resolvedInput: ValidationResult<T, D> = defaults
      ? merge(defaults, input, { arrayMerge, isMergeableObject: isPlainObject })
      : input;

    try {
      // We can use partial shape here because `validateKeys` has already
      // checked for extraneous keys.
      ow(resolvedInput, name ?? 'options', spec);
    } catch (err) {
      throw new TypeError(formatMessage(err));
    }

    return resolvedInput;
  };

  return validator;
}
