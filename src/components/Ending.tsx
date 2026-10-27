import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Play, RotateCcw, SkipForward } from 'lucide-react';
import { ARCHIVE_ID } from '../data/config';
import { fragmentById, fragments, type FragmentId } from '../data/fragments';
import { returnChoice } from '../data/endings';
import { deriveField } from '../state/derive';
import { composeEnding } from '../state/composeEnding';
import { possibleOrders, recordCode } from '../state/record';
import type { Deletion } from '../state/reducer';
import { formatCount, formatTime, pad } from '../utils/format';
import TraceMap from './TraceMap';
import DeletionLog from './DeletionLog';
import EndingPortrait from './EndingPortrait';
import EndingReturn, { type ReturnDecision } from './EndingReturn';
import RecordCard from './RecordCard';
import '../styles/ending.css';

type Props = {
  deletions: Deletion[];
  hesitations: FragmentId[];
  onRestart: () => void;
};

// replay: deletions happen again on the map, one by one
// shape:  the line through the deleted places is drawn
// done:   the words, the portrait, the one return, and the record appear
type Stage = 'replay' | 'shape' | 'done';

const FIRST_STEP_MS = 1200;
const STEP_MS = 1500;
const SHAPE_PAUSE_MS = 1400;
const SHAPE_DRAW_MS_PER_POINT = 450;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/** Words surface one after another, out of a blur. */
function RevealWords({ text, delay = 0 }: { text: string; delay?: number }) {
  return text.split(' ').map((word, i) => (
    <motion.span
      key={i}
      className="reveal-word"
      initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {word}{' '}
    </motion.span>
  ));
}

export default function Ending({ deletions, hesitations, onRestart }: Props) {
  const reduceMotion = useReducedMotion();
  const canReplay = deletions.length > 0 && !reduceMotion;
  const [stage, setStage] = useState<Stage>(canReplay ? 'replay' : 'done');
  const [step, setStep] = useState(canReplay ? 0 : deletions.length);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  // Local on purpose: the return belongs to this ending only, and restarting discards it with the rest.
  const [decision, setDecision] = useState<ReturnDecision | null>(null);
  const returned = decision?.kind === 'returned' ? decision.id : null;
  const decided = decision !== null || deletions.length === 0;

  const order = useMemo(() => deletions.map((d) => d.id), [deletions]);
  const finalView = useMemo(() => deriveField(deletions), [deletions]);
  const replayView = useMemo(() => deriveField(deletions.slice(0, step)), [deletions, step]);
  const ending = useMemo(() => composeEnding(deletions, hesitations), [deletions, hesitations]);

  const deleted = new Set(order);
  const remaining = fragments.filter((f) => !deleted.has(f.id));
  const alteredCount = remaining.filter((f) => (finalView.fragments.get(f.id)?.influences.length ?? 0) > 0).length;
  const shownDeleted = new Set(order.slice(0, step).filter((id) => stage !== 'done' || id !== returned));
  const current = step > 0 ? deletions[step - 1] : null;

  // Drive the replay: one deletion per beat, then the void line, then the words.
  useEffect(() => {
    if (stage === 'replay') {
      if (step < deletions.length) {
        const t = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? FIRST_STEP_MS : STEP_MS);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setStage('shape'), SHAPE_PAUSE_MS);
      return () => window.clearTimeout(t);
    }
    if (stage === 'shape') {
      const t = window.setTimeout(() => setStage('done'), SHAPE_DRAW_MS_PER_POINT * deletions.length + 900);
      return () => window.clearTimeout(t);
    }
  }, [stage, step, deletions.length]);

  // While replaying, keyboard users start on "skip"; once the words appear, they start on the words.
  useEffect(() => {
    if (stage === 'replay') skipRef.current?.focus();
    if (stage === 'done') headingRef.current?.focus();
  }, [stage]);

  const skip = () => {
    setStep(deletions.length);
    setStage('done');
  };
  const replay = () => {
    setStep(0);
    setStage('replay');
  };

  // Each hesitated fragment once, in first-hesitation order, with how many times.
  const hesitationCounts = [...new Set(hesitations)].map((id) => ({
    id,
    times: hesitations.filter((h) => h === id).length,
  }));

  return (
    <motion.main
      className="ending"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.header className="ending__meta meta" {...reveal(0)}>
        <span>{ARCHIVE_ID} / RESULT</span>
        <span>{recordCode(deletions)}</span>
      </motion.header>

      <motion.section className="ending__replay" aria-label="삭제 기록 재생" {...reveal(0.2)}>
        <div className="ending__ticker meta" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={stage === 'replay' ? step : stage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {stage === 'replay' && !current && 'REPLAY — 처음의 배치'}
              {stage === 'replay' && current && (
                <>
                  {pad(step)} / {pad(deletions.length)} · {formatTime(current.at)} ·{' '}
                  <s>{fragmentById.get(current.id)?.title}</s>
                </>
              )}
              {stage === 'shape' && 'THE SHAPE OF WHAT WAS DELETED'}
              {stage === 'done' && (deletions.length > 0 ? 'END OF RECORD' : 'NOTHING DELETED')}
            </motion.span>
          </AnimatePresence>
        </div>

        <TraceMap
          deleted={shownDeleted}
          returned={stage === 'done' ? returned : null}
          bonds={replayView.bonds}
          pulse={stage === 'replay' && current ? { from: current.id, key: step } : null}
          voidOrder={stage === 'replay' ? null : order}
          drawVoid={stage === 'shape'}
        />

        <div className="ending__replay-foot">
          <p className="note">
            {deletions.length > 1
              ? '흰 선은 당신이 지운 순서대로 빈자리를 이은 것입니다. 같은 모양은 같은 순서에서만 생깁니다.'
              : '처음의 배치 위에, 남은 것과 지운 자리.'}
          </p>
          {stage !== 'done' ? (
            <button ref={skipRef} type="button" className="text-button ending__control" onClick={skip}>
              <SkipForward aria-hidden="true" size={14} strokeWidth={1.25} />
              건너뛰기
            </button>
          ) : (
            canReplay && (
              <button type="button" className="text-button ending__control" onClick={replay}>
                <Play aria-hidden="true" size={14} strokeWidth={1.25} />
                다시 재생
              </button>
            )
          )}
        </div>
      </motion.section>

      {stage === 'done' && (
        <>
          <section className="ending__words" aria-labelledby="ending-title">
            <h1 id="ending-title" ref={headingRef} tabIndex={-1} className="ending__opening">
              <RevealWords text={ending.opening} />
            </h1>
            {ending.hesitation && (
              <p className="ending__hesitation-line">
                <RevealWords text={ending.hesitation} delay={1.2} />
              </p>
            )}
          </section>

          <motion.div {...reveal(ending.hesitation ? 2.4 : 1.6)}>
            <EndingPortrait view={finalView} deleted={deleted} returned={returned} />
          </motion.div>

          {deletions.length > 0 && (
            <motion.div {...reveal(ending.hesitation ? 3 : 2.2)}>
              <EndingReturn candidates={order} decision={decision} onDecide={setDecision} />
            </motion.div>
          )}

          {/* The last words wait for the return to be decided (there is nothing to decide with no deletions). */}
          {decided && (
            <section className="ending__final" aria-label="마지막 문장">
              {decision && (
                <p className="ending__final-line">
                  <RevealWords text={decision.kind === 'returned' ? returnChoice.returned : returnChoice.declined} delay={decision.kind === 'returned' ? 3 : 0.6} />
                </p>
              )}
              <motion.p className="ending__closing" {...reveal(decision?.kind === 'returned' ? 4.4 : decision ? 1.8 : 2.6)}>
                {ending.closing}
              </motion.p>
            </section>
          )}

          {decided && (
            <motion.div {...reveal(decision?.kind === 'returned' ? 5 : 2.4)}>
              <RecordCard
                deletions={deletions}
                view={finalView}
                returned={returned}
                finalLine={
                  decision?.kind === 'returned'
                    ? returnChoice.returned
                    : decision?.kind === 'declined'
                      ? returnChoice.declined
                      : ending.closing
                }
              />
            </motion.div>
          )}

          <motion.div className="ending__record" {...reveal(decision ? 0.4 : 3.4)}>
            <div className="ending__figures">
              <dl className="ending__stats">
                <div><dt className="meta">DELETED</dt><dd>{pad(deleted.size)}</dd></div>
                <div><dt className="meta">REMAINING</dt><dd>{pad(remaining.length)}</dd></div>
                <div><dt className="meta">ALTERED</dt><dd>{pad(alteredCount)}</dd></div>
                <div><dt className="meta">HESITATED</dt><dd>{pad(hesitations.length)}</dd></div>
              </dl>
              <p className="ending__code">
                <span className="meta">{recordCode(deletions)}</span>
                {deletions.length > 0
                  ? `이 순서는 ${formatCount(possibleOrders(deletions.length))}가지 가운데 하나입니다.`
                  : '아무것도 지우지 않은 기록은 단 하나뿐입니다.'}
              </p>
            </div>

            <div className="ending__side">
              {hesitationCounts.length > 0 && (
                <section className="ending__hesitations" aria-labelledby="hesitations-title">
                  <h2 id="hesitations-title" className="meta">HESITATIONS — {pad(hesitations.length)}</h2>
                  <ul>
                    {hesitationCounts.map(({ id, times }) => (
                      <li key={id}>
                        <span className="meta">{fragmentById.get(id)?.archiveNo}</span>
                        <span>
                          {fragmentById.get(id)?.title}
                          <span className="ending__hesitation-note">
                            {times > 1 ? ` ${times}번 망설임 · ` : ' 망설임 · '}
                            {deleted.has(id) ? '결국 지움' : '남겨 둠'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <DeletionLog deletions={deletions} />
            </div>
          </motion.div>

          <motion.footer className="ending__footer" {...reveal(decision ? 0.6 : 3.6)}>
            <button type="button" className="ending__restart" onClick={onRestart}>
              <RotateCcw aria-hidden="true" size={16} strokeWidth={1.25} />
              <span>처음부터 다시</span>
            </button>
            <p className="note">이 기록은 어디에도 저장되지 않습니다.</p>
          </motion.footer>
        </>
      )}
    </motion.main>
  );
}
