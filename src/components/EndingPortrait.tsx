import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { fragmentById, fragments, type FragmentId } from '../data/fragments';
import { portrait } from '../data/endings';
import { returnedSummary } from '../data/returns';
import type { FieldView } from '../state/derive';
import { fillCounts, pad } from '../utils/format';

type Props = {
  view: FieldView;
  deleted: Set<FragmentId>;
  returned: FragmentId | null;
};

// Effects carry over into the prose, but softer than on the field so every sentence stays readable.
const PROSE_OPACITY_FLOOR = 0.65;

/**
 * The eight sentences as they were, beside the same eight places now:
 * deleted sentences leave a blank of their own length; rewritten ones name what rewrote them.
 */
export default function EndingPortrait({ view, deleted, returned }: Props) {
  const remaining = fragments.filter((f) => !deleted.has(f.id));
  const rewritten = remaining.filter((f) => view.fragments.get(f.id)?.summary !== f.summary);
  const counts = { d: deleted.size, r: remaining.length, c: rewritten.length };
  const summary =
    deleted.size === 0 ? portrait.none : rewritten.length > 0 ? fillCounts(portrait.changed, counts) : fillCounts(portrait.unchanged, counts);

  return (
    <section className="portrait" aria-labelledby="portrait-title">
      <h2 id="portrait-title" className="visually-hidden">
        처음의 나와 지금의 나
      </h2>
      <div className="portrait__columns">
        <div className="portrait__column portrait__column--before">
          <h3 className="portrait__heading">
            처음의 나 <span className="meta">BEFORE · {pad(fragments.length)}</span>
          </h3>
          <p className="portrait__prose">
            {fragments.map((f) => (
              <span key={f.id} className="portrait__sentence">
                {f.summary}{' '}
              </span>
            ))}
          </p>
        </div>

        <div className="portrait__column portrait__column--now">
          <h3 className="portrait__heading">
            지금의 나 <span className="meta">NOW · {pad(remaining.length + (returned ? 1 : 0))}</span>
          </h3>
          <p className="portrait__prose">
            {fragments.map((f, i) => {
              if (f.id === returned) {
                return (
                  <motion.span
                    key={`${f.id}-returned`}
                    className="portrait__sentence portrait__sentence--returned"
                    initial={{ opacity: 0, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.4, delay: 1.6 }}
                  >
                    {returnedSummary[f.id]}
                    <sup className="portrait__source">↺ {f.archiveNo}</sup>{' '}
                  </motion.span>
                );
              }
              if (deleted.has(f.id)) {
                // A blank as long as the sentence it replaces: the shape of what is gone, in prose.
                return (
                  <motion.span
                    key={f.id}
                    className="portrait__gap"
                    style={{ '--length': [...f.summary].length } as CSSProperties}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="visually-hidden">(지워진 문장: {f.summary})</span>
                  </motion.span>
                );
              }
              const v = view.fragments.get(f.id);
              const changed = v ? v.summary !== f.summary : false;
              const sources = v?.influences.map((inf) => fragmentById.get(inf.from)?.archiveNo).filter(Boolean) ?? [];
              return (
                <span
                  key={f.id}
                  className="portrait__sentence"
                  data-changed={changed || undefined}
                  style={{ opacity: Math.max(PROSE_OPACITY_FLOOR, v?.opacity ?? 1), '--boost': v?.scale ?? 1 } as CSSProperties}
                >
                  {v?.summary ?? f.summary}
                  {sources.length > 0 && (
                    <sup className="portrait__source">
                      <span className="visually-hidden">영향을 준 조각: </span>← {sources.join(' · ')}
                    </sup>
                  )}{' '}
                </span>
              );
            })}
          </p>
        </div>
      </div>

      <div className="portrait__reading">
        <p>{summary}</p>
        {rewritten.length > 0 && <p className="portrait__note">{portrait.changedNote}</p>}
      </div>
    </section>
  );
}
