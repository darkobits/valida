import { ObjectPredicate } from 'ow';
import * as R from 'ramda';

import suggestKey, { ValidateKeysResult } from 'lib/suggest-key';
import { decorateMethod } from 'lib/utils';


let isDecorated = false;


/**
 * Ow doesn't provide a way to hook into existing validators to provide
 * additional functionality.
 */
export function decorateOw() {
  if (isDecorated) {
    return;
  }

  decorateMethod(ObjectPredicate, 'hasKeys', ({ instance, method, args }) => {
    const validKeys = args as Array<string>;

    instance.addValidator({
      validator: (value: Record<string, any>) => {
        const testKeys = R.keys(value);

        // If we subtract the set of used keys from the set of valid keys and
        // the result 0, we know the user exhausted all required keys.
        if (R.difference(validKeys, testKeys).length === 0) {
          return true;
        }

        return suggestKey(validKeys, testKeys);
      },
      message: (value: any, label: string, { missingKey, closestExtraneousKey }: ValidateKeysResult) => {
        return `Property \`${closestExtraneousKey}\` in ${label} may be a mistake. Did you mean \`${missingKey}\`?`;
      }
    });

    return method(...args as Array<string>);
  });

  decorateMethod(ObjectPredicate, 'hasAnyKeys', ({ instance, method, args }) => {
    const validKeys = args as Array<string>;

    instance.addValidator({
      validator: (value: Record<string, any>) => {
        const testKeys = R.keys(value);

        // If we subtract the set of used keys from the set of valid keys and
        // the result is shorter than the set of valid keys, we know the user
        // used at least one valid key.
        if (R.difference(validKeys, testKeys).length < validKeys.length) {
          return true;
        }

        return suggestKey(validKeys, testKeys);
      },
      message: (value: any, label: string, { missingKey, closestExtraneousKey }: ValidateKeysResult) => {
        return `Property \`${closestExtraneousKey}\` in ${label} may be a mistake. Did you mean \`${missingKey}\`?`;
      }
    });

    return method(...args as Array<string>);
  });

  decorateMethod(ObjectPredicate, 'partialShape', ({ instance, method, args }) => {
    const [shape] = args;

    // For `partialShape`, required keys are any keys that are not marked as
    // `optional`.
    const requiredKeys = R.reduce((keys, [key, value]) => {
      return R.path<boolean>(['context', 'optional'], value) ? keys : [...keys, key];
    }, [] as Array<string>, R.toPairs(shape));


    instance.addValidator({
      validator: (value: Record<string, any>) => suggestKey(requiredKeys, R.keys(value)),
      message: (value: any, label: string, { missingKey, closestExtraneousKey }: ValidateKeysResult) => {
        return `Extraneous property \`${closestExtraneousKey}\` in ${label} may be a mistake. Did you mean \`${missingKey}\`?`;
      }
    });

    return method(...args);
  });

  decorateMethod(ObjectPredicate, 'exactShape', ({ instance, method, args }) => {
    const [shape] = args;
    const requiredKeys = R.keys(shape) as Array<string>;

    instance.addValidator({
      validator: (value: Record<string, any>) => {
        const testKeys = R.keys(value);
        return suggestKey(requiredKeys, testKeys);
      },
      message: (value: any, label: string, { missingKey, closestExtraneousKey }: ValidateKeysResult) => {
        return `Extraneous property \`${closestExtraneousKey}\` in ${label} may be a mistake. Did you mean \`${missingKey}\`?`;
      }
    });

    return method(...args);
  });

  isDecorated = true;
}
