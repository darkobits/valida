import { Predicate } from 'ow';


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


export function isPredicate(value: any): value is Predicate {
  return value instanceof Predicate;
}
