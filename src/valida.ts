import merge from 'deepmerge';
import ow from 'ow';

import { decorateOw } from 'lib/decorate-ow';
import { formatMessage, isPredicate } from 'lib/utils';

import type { SpecFn } from 'etc/types';


decorateOw();


/**
 * @private
 *
 * If the user did not configure a validator with an array merging function, the
 * default behavior is to favor the array value in the incoming object.
 */
function defaultArrayMerge(target: Array<any>, source: Array<any>) {
  return source ? source : target;
}


export default function createValidator<T extends Record<string, any>>(specFn: SpecFn<T>) {
  // Resolve options.
  const { name, spec, defaults, arrayMerge: userArrayMerge } = specFn({ ow });
  const arrayMerge = userArrayMerge ?? defaultArrayMerge;

  try {
    // Validate inputs.
    // ow(spec, 'spec', ow.object);
    // Skip validating defaults as ow does not support "deep" partialShape.
    // ow(defaults, 'defaults', ow.optional.object.partialShape(spec));
    // ow(arrayMerge, 'arrayMerge', ow.function);
  } catch (err) {
    throw new TypeError(`Error creating validator: ${err.message}`);
  }


  /**
   * Validates the provided input value against `spec`.
   */
  return (input: any) => {
    const resolvedInput = defaults ? merge(defaults, input, { arrayMerge }) : input;
    const resolvedSpec = isPredicate(spec) ? spec : ow.object.partialShape(spec);
    try {

      // We can use partial shape here because `validateKeys` has already
      // checked for extraneous keys.
      ow(resolvedInput, name ?? 'options', resolvedSpec);
    } catch (err) {
      throw new TypeError(formatMessage(err));
    }

    return resolvedInput ;
  };
}
