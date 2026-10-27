import { fragmentById, fragments } from '../data/fragments';
import type { Deletion } from './reducer';

/** A code that is the deletion order itself, e.g. F-01, F-06, F-05 → "REC-165". Same order, same code. */
export function recordCode(deletions: Deletion[]): string {
  const digits = deletions.map((d) => fragmentById.get(d.id)?.archiveNo.slice(-1) ?? '?').join('');
  return `REC-${digits || '0'}`;
}

/** How many different ordered ways there are to delete this many fragments: n! / (n − k)!. */
export function possibleOrders(k: number, n = fragments.length): number {
  let total = 1;
  for (let i = 0; i < k; i++) total *= n - i;
  return total;
}
