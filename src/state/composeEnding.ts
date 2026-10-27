import { fragmentById, fragments, type FragmentId } from '../data/fragments';
import { closing, closingNone, FEW_LIMIT, hesitation, lastRemaining, openings, twoRemaining } from '../data/endings';
import { withAndParticle, withObjectParticle, withTopicParticle } from '../utils/format';
import { bonds } from './derive';
import type { Deletion } from './reducer';

// The ending speaks about what remains; deleted fragments are shown on the map and in the log, not narrated.
export type Ending = {
  opening: string;
  /** The viewer cancelled a deletion at least once. */
  hesitation: string | null;
  closing: string;
};

const PARTICLES: Record<string, (word: string) => string> = {
  을: withObjectParticle,
  은: withTopicParticle,
  과: withAndParticle,
};

/** Replaces {key} with 「title」 and a directly following {을}/{은}/{과} with the particle that fits the title. */
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}(?:\{(을|은|과)\})?/g, (whole, key: string, particle?: string) => {
    const title = values[key];
    if (title === undefined) return whole;
    return `「${title}」${particle ? PARTICLES[particle](title).slice(-1) : ''}`;
  });
}

export function composeEnding(deletions: Deletion[], hesitations: FragmentId[]): Ending {
  const deleted = new Set<FragmentId>(deletions.map((d) => d.id));
  const remaining = fragments.filter((f) => !deleted.has(f.id));
  const count = deleted.size;

  // A hesitation over something that is still here says more than one that was overcome.
  const hesitatedId = hesitations.find((id) => !deleted.has(id)) ?? hesitations[0];
  const hesitatedTitle = hesitatedId ? fragmentById.get(hesitatedId)?.title : undefined;
  const hesitationLine = hesitatedTitle
    ? fill(deleted.has(hesitatedId) ? hesitation.deletedAfter : hesitation.kept, { t: hesitatedTitle })
    : null;

  if (count === 0) return { opening: openings.none, hesitation: hesitationLine, closing: closingNone };

  let opening: string;

  if (remaining.length === 0) {
    opening = openings.all;
  } else if (remaining.length === 1) {
    opening = lastRemaining[remaining[0].id];
  } else if (remaining.length === 2) {
    const [a, b] = remaining;
    const bound = bonds.some((bond) => bond.between.includes(a.id) && bond.between.includes(b.id));
    opening = `${fill(twoRemaining.opening, { a: a.title, b: b.title })} ${bound ? twoRemaining.bound : twoRemaining.unbound}`;
  } else {
    opening = count <= FEW_LIMIT ? openings.few : openings.many;
  }

  return { opening, hesitation: hesitationLine, closing };
}
