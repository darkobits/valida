import merge from 'deepmerge';
import ow from 'ow';

import {
  formatMessage,
  shortestLevenshteinDistance
} from 'lib/utils';

import type { SpecFn } from 'etc/types';


/**
 * @private
 *
 * Recursively validates the keys of the input object. For any extraneous keys
 * found, throws an error suggesting possible valid keys.
 */
function validateKeys(input: any, curSpec: any, curPath: Array<string> = []) {
  if (ow.isValid(input, ow.object.plain) && ow.isValid(curSpec, ow.object.plain)) {
    const validKeys = Object.keys(curSpec);

    for (const key of Object.keys(input)) {
      if (!validKeys.includes(key)) {
        const atPath = curPath.length > 0 ? ` at path \`${curPath.join('.')}\`` : '';
        const suggestKey = shortestLevenshteinDistance(validKeys, key);
        throw new TypeError(`Did not expect property \`${key}\`${atPath} to exist. Did you mean '${suggestKey}'?`);
      }
    }

    for (const key of validKeys) {
      validateKeys(input[key], curSpec[key], [...curPath, key]);
    }
  }
}


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
  const { spec, defaults, arrayMerge: userArrayMerge } = specFn({ ow });
  const arrayMerge = userArrayMerge ?? defaultArrayMerge;

  try {
    // Validate inputs.
    ow(spec, 'spec', ow.object);
    // Skip validating defaults as ow does not support "deep" partialShape.
    // ow(defaults, 'defaults', ow.optional.object.partialShape(spec));
    ow(arrayMerge, 'arrayMerge', ow.function);
  } catch (err) {
    throw new TypeError(`Error creating validator: ${err.message}`);
  }


  /**
   * Validates the provided input value against `spec`.
   */
  return (input: any) => {
    const resolvedInput = defaults ? merge(defaults, input, { arrayMerge }) : input;
    validateKeys(resolvedInput, spec);

    try {
      // We can use partial shape here because `validateKeys` has already
      // checked for extraneous keys.
      ow(resolvedInput, ow.object.partialShape(spec));
    } catch (err) {
      throw new TypeError(formatMessage(err));
    }

    return resolvedInput as T;
  };
}
