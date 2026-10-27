import { fragmentById } from './fragments';
import type { Bond } from './relations';

/**
 * Drops bonds that reference unknown fragments or keys outside their own pair,
 * so a typo in the data degrades to "no connection" instead of a crash.
 * Problems are reported in development only.
 */
export function validBonds(bonds: Bond[]): Bond[] {
  const seenPairs = new Set<string>();
  const problems: string[] = [];

  const result = bonds.filter((bond) => {
    const [a, b] = bond.between;
    if (!fragmentById.has(a) || !fragmentById.has(b) || a === b) {
      problems.push(`${bond.id}: invalid pair ${a} / ${b}`);
      return false;
    }
    const pair = [a, b].sort().join('|');
    if (seenPairs.has(pair)) {
      problems.push(`${bond.id}: duplicate pair ${pair}`);
      return false;
    }
    seenPairs.add(pair);
    for (const key of Object.keys(bond.onDelete)) {
      if (key !== a && key !== b) problems.push(`${bond.id}: onDelete key "${key}" is not part of the pair (ignored)`);
    }
    return true;
  });

  if (import.meta.env.DEV && problems.length > 0) {
    console.warn('[relations] data problems:\n' + problems.join('\n'));
  }
  return result;
}
