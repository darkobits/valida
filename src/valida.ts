import merge from 'deepmerge';
import ow from 'ow';

import { decorateOw } from 'lib/decorate-ow';
import { formatMessage, isPredicate } from 'lib/utils';

import type { SpecFn, ShapeFor } from 'etc/types';


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


function getOptions<T>(specFn: SpecFn<T>) {
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


export default function createValidator<T>(specFn: SpecFn<T>) {
  const { name, spec, defaults, arrayMerge } = getOptions(specFn);

  /**
   * Validates the provided input value against `spec`.
   */
  return (input: any) => {
    const resolvedInput = defaults ? merge(defaults, input, { arrayMerge }) : input;

    try {
      // We can use partial shape here because `validateKeys` has already
      // checked for extraneous keys.
      ow(resolvedInput, name ?? 'options', spec);
    } catch (err) {
      throw new TypeError(formatMessage(err));
    }

    return resolvedInput as ShapeFor<T>;
  };
}
