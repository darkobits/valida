import { get as getLevenshteinDistance } from 'fast-levenshtein';


/**
 * Provided an array of search strings and a subject string, returns the search
 * string with the shortest Levenshtein Distance to the subject string.
 */
export function shortestLevenshteinDistance(searchStrings: Array<string>, subjectString: string) {
  return searchStrings.map(string => ({
    string,
    distance: getLevenshteinDistance(string, subjectString, { useCollator: true })
  })).sort((a, b) => (a.distance > b.distance ? 1 : a.distance < b.distance ? -1 : 0))[0].string;
}


/**
 * Provided an error, formats its message and returns it.
 */
export function formatMessage(err: any) {
  if (!err || typeof err.stack !== 'string') return;

  return err.message.split('\n').map((line: string) => {
    if (line.endsWith(':')) {
      return line;
    }

    return `${line}.`;
  }).join('\n') as string;
}
