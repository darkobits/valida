import { distance as levenshteinDistance } from 'fastest-levenshtein';
import * as R from 'ramda';


/**
 * @private
 *
 * Provided two lists of strings, evaluates all possible Levenshtein distances
 * from each item in the first list to each item in the second list. Returns an
 * object describing the relationship with the shortest non-zero distance that
 * does not exceed `maxDistance`.
 */
function levenshteinDistanceMatrix(stringsA: Array<string>, stringsB: Array<string>, maxDistance = 2) {
  if (R.difference(stringsA, stringsB).length === 0) {
    return;
  }

  const results: Array<{ distance: number; stringA: string; stringB: string}> = [];

  for (const stringA of stringsA) {
    for (const stringB of stringsB) {
      // Distance is zero.
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
  return closestResult;
}


export interface ValidateKeysResult {
  missingKey: string;
  closestExtraneousKey: string;
}


export default function suggestKey(validKeys: Array<string>, testKeys: Array<string>): true | ValidateKeysResult {
  // For shape-matching, any keys left after subtracting all test keys from
  // all required/known/valid keys is the set of missing keys
  const missingKeys = R.difference(validKeys, testKeys);

  if (missingKeys.length === 0) {
    return true;
  }

  // Conversely, by subtracting all keys from the set of required keys
  // from the set of provided keys, we can get the set of extraneous keys.
  const extraneousKeys = R.difference(testKeys, validKeys);

  const match = levenshteinDistanceMatrix(missingKeys, extraneousKeys);

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
