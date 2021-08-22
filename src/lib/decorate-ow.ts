/* eslint-disable @typescript-eslint/naming-convention */
import { distance as levenshteinDistance } from 'fastest-levenshtein';
import { ObjectPredicate } from 'ow';
import * as R from 'ramda';

import type { Predicate } from 'ow/dist/predicates/predicate';


function closestMatrix(stringsA: Array<string>, stringsB: Array<string>, maxDistance = 2) {
  if (R.difference(stringsA, stringsB).length === 0) {
    return;
  }

  const results: Array<{ distance: number; stringA: string; stringB: string}> = [];

  for (const stringA of stringsA) {
    for (const stringB of stringsB) {
      if (stringA === stringB) {
        break;
      }

      const distance = levenshteinDistance(stringA, stringB);

      if (distance <= maxDistance) {
        results.push({ distance, stringA, stringB });
      }
    }
  }

  const sortedResults = R.sortBy(R.prop('distance'), results);
  const [closestResult] = sortedResults;
  // console.warn('[closestMatrix] Closest result:', closestResult);
  return closestResult;
}


interface ValidateKeysResult {
  missingKey: string;
  closestExtraneousKey: string;
}


function validateKeys(requiredKeys: Array<string>, testKeys: Array<string>): true | ValidateKeysResult {
  // For exact shape matching, we _must_ have all required keys.
  // Therefore, any keys left over after subtracting all test keys from
  // all required keys is the set of missing keys.
  const missingKeys = R.difference(requiredKeys, testKeys);

  if (missingKeys.length === 0) {
    return true;
  }

  // Conversely, by subtracting all keys from the set of required keys
  // from the set of provided keys, we can get the set of extraneous keys.
  const extraneousKeys = R.difference(testKeys, requiredKeys);

  const match = closestMatrix(missingKeys, extraneousKeys);

  // If we couldn't find any extraneous keys within the allowed distance,
  // then we shouldn't suggest any keys. Pass, and let the default
  // validator fail.
  if (!match) {
    return true;
  }

  return {
    missingKey: match.stringA,
    closestExtraneousKey: match.stringB
  };
}


/**
 * This is atrocious, but necessary; ow has no way of registering global
 * validators (probably not wise anyway), and no way of creating custom ow
 * instances with instance-wide custom validators. The only way to add custom
 * logic seems to require adding it at every invocation of ow(), which we can't
 * expect the user to do. So let's decorate. 🎁
 */
export function decorateOw() {
  const originalMethods = {
    hasKeys: ObjectPredicate.prototype['hasKeys'],
    hasAnyKeys: ObjectPredicate.prototype['hasAnyKeys'],
    partialShape: ObjectPredicate.prototype['partialShape'],
    exactShape: ObjectPredicate.prototype['exactShape'],
    deepEqual: ObjectPredicate.prototype['deepEqual']
  };

  // ObjectPredicate.prototype['hasKeys'] = function(this: Predicate, ...args: Array<any>) {
  //   this.addValidator({
  //     validator: () => {
  //       return false;
  //     },
  //     message: () => {
  //       return 'hasKeys';
  //     }
  //   });

  //   return Reflect.apply(originalMethods['hasKeys'], this, args);
  // };

  // ObjectPredicate.prototype['hasAnyKeys'] = function(this: Predicate, ...args: Parameters<typeof ObjectPredicate['prototype']['hasAnyKeys']>) {
  //   const validKeys = args[0] as Array<string>;
  //   this.addValidator({
  //     validator: (...args: Array<any>) => {

  //       return true;
  //     },
  //     message: () => {
  //       return 'hasAnyKeys';
  //     }
  //   });

  //   return Reflect.apply(originalMethods['hasAnyKeys'], this, args);
  // };


  ObjectPredicate.prototype['partialShape'] = function(this: Predicate, ...args: Parameters<typeof ObjectPredicate['prototype']['partialShape']>) {
    const [shape] = args;

    const requiredKeys = R.reduce((keys, [key, value]) => {
      const isOptional = R.path<boolean>(['context', 'optional'], value);
      return isOptional ? keys : [...keys, key];
    }, [] as Array<string>, R.toPairs(shape));


    this.addValidator({
      validator: (value: Record<string, any>) => {
        const testKeys = R.keys(value);
        return validateKeys(requiredKeys, testKeys);
      },
      message: (value: any, label: string, { missingKey, closestExtraneousKey }: ValidateKeysResult) => {
        return `Extraneous property \`${closestExtraneousKey}\` in ${label} may be a mistake. Did you mean \`${missingKey}\`?`;
      }
    });

    return Reflect.apply(originalMethods['partialShape'], this, args);
  };

  ObjectPredicate.prototype['exactShape'] = function(this: Predicate, ...args: Parameters<typeof originalMethods['exactShape']>) {
    const [shape] = args;
    const requiredKeys = R.keys(shape) as Array<string>;

    this.addValidator({
      validator: (value: Record<string, any>) => {
        const testKeys = R.keys(value);
        return validateKeys(requiredKeys, testKeys);
      },
      message: (value: any, label: string, { missingKey, closestExtraneousKey }: ValidateKeysResult) => {
        return `Extraneous property \`${closestExtraneousKey}\` in ${label} may be a mistake. Did you mean \`${missingKey}\`?`;
      }
    });

    return Reflect.apply(originalMethods['exactShape'], this, args);
  };

  // ObjectPredicate.prototype['deepEqual'] = function(this: Predicate, ...args: Array<any>) {
  //   const foo = this.addValidator({
  //     validator: () => {
  //       return false;
  //     },
  //     message: () => {
  //       return 'deepEqual';
  //     }
  //   });

  //   return Reflect.apply(originalMethods['deepEqual'], this, args);
  // };


}
