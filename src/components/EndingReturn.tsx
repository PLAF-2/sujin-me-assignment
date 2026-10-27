import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Undo2 } from 'lucide-react';
import { fragmentById, type FragmentId } from '../data/fragments';
import { returnChoice } from '../data/endings';
import { returnedSummary } from '../data/returns';
import { seededRandom } from '../utils/random';

export type ReturnDecision = { kind: 'returned'; id: FragmentId } | { kind: 'declined' };

type Props = {
  /** Deleted fragments, in deletion order. */
  candidates: FragmentId[];
  decision: ReturnDecision | null;
  onDecide: (decision: ReturnDecision) => void;
};

/** One chance to bring a deleted fragment back. It returns, but as a different sentence. */
export default function EndingReturn({ candidates, decision, onDecide }: Props) {
  const [chosen, setChosen] = useState<FragmentId | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  // After deciding, the choice buttons are gone; carry focus to what happened.
  useEffect(() => {
    if (decision) resultRef.current?.focus();
  }, [decision]);

  if (decision?.kind === 'returned') {
    const f = fragmentById.get(decision.id);
    if (!f) return null;
    let letter = 0;
    return (
      <section className="return" aria-labelledby="return-result">
        <p className="meta">ONE RETURN — {f.archiveNo}</p>
        <h2 id="return-result" ref={resultRef} tabIndex={-1} className="return__title" aria-label={f.title}>
          {/* The title gathers back from the scatter it left in, letter by letter. */}
          {[...f.title].map((ch) => {
            const seed = seededRandom(letter, 3);
            return (
              <motion.span
                key={letter}
                className="return__letter"
                aria-hidden="true"
                initial={{ opacity: 0, x: (seed - 0.5) * 30, y: -14 - seed * 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, delay: 0.1 + letter++ * 0.05 + seed * 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            );
          })}
        </h2>
        <motion.div
          className="return__sentences"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <p className="return__was">
            <span className="meta">BEFORE</span> <s>{f.summary}</s>
          </p>
          <p className="return__now">
            <span className="meta">NOW</span> {returnedSummary[f.id]}
          </p>
        </motion.div>
        <motion.p className="return__note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2.2 }}>
          {returnChoice.returnedNote}
        </motion.p>
      </section>
    );
  }

  if (decision?.kind === 'declined') {
    return (
      <section className="return" aria-labelledby="return-result">
        <p className="meta">ONE RETURN — DECLINED</p>
        <h2 id="return-result" ref={resultRef} tabIndex={-1} className="return__declined">
          되돌리지 않았습니다.
        </h2>
      </section>
    );
  }

  return (
    <section className="return" aria-labelledby="return-prompt">
      <p className="meta">ONE RETURN</p>
      <h2 id="return-prompt" className="return__prompt">
        {returnChoice.prompt}
      </h2>
      <div className="return__choices" role="group" aria-label="되돌릴 조각">
        {candidates.map((id) => {
          const f = fragmentById.get(id);
          if (!f) return null;
          return (
            <button
              key={id}
              type="button"
              className="return__choice"
              aria-pressed={chosen === id}
              onClick={() => setChosen(chosen === id ? null : id)}
            >
              <span className="meta">× {f.archiveNo}</span>
              <span>{f.title}</span>
            </button>
          );
        })}
      </div>
      <div className="return__actions">
        <button
          type="button"
          className="return__confirm"
          disabled={!chosen}
          onClick={() => chosen && onDecide({ kind: 'returned', id: chosen })}
        >
          <Undo2 aria-hidden="true" size={16} strokeWidth={1.25} />
          {chosen ? `「${fragmentById.get(chosen)?.title}」 되돌리기` : '되돌릴 조각을 고르세요'}
        </button>
        <button type="button" className="text-button" onClick={() => onDecide({ kind: 'declined' })}>
          되돌리지 않기
        </button>
      </div>
    </section>
  );
}
