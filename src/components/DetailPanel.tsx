import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eraser, X } from 'lucide-react';
import { fragmentById, type Fragment } from '../data/fragments';
import { withObjectParticle } from '../utils/format';
import { describeEffects, type FragmentView, type LineState } from '../state/derive';

export type Connection = { other: Fragment; label: string; state: LineState };

type Props = {
  fragment: Fragment | null;
  view: FragmentView | null;
  connections: Connection[];
  onClose: () => void;
  onDelete: () => void;
  /** Called with the panel element once a record has opened, so the field can adjust scrolling. */
  onOpen: (panel: HTMLElement) => void;
};

const LINE_WORDS: Record<LineState, string> = {
  intact: '',
  severed: '끊어짐',
  frayed: '흐트러짐',
  persisting: '남아 있음',
};

export default function DetailPanel({ fragment, view, connections, onClose, onDelete, onOpen }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="detail-panel"
      className="detail-panel"
      data-open={fragment ? true : undefined}
      aria-label="선택한 조각의 기록"
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        {fragment ? (
          <motion.div
            key={fragment.id}
            className="detail-panel__content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35 }}
            onAnimationStart={() => sectionRef.current && onOpen(sectionRef.current)}
          >
            <div className="detail-panel__head">
              <p className="meta">{fragment.archiveNo} / SELECTED</p>
              <button type="button" className="icon-button" onClick={onClose} aria-label="기록 닫기">
                <X aria-hidden="true" size={18} strokeWidth={1.25} />
              </button>
            </div>
            <div className="detail-panel__body">
              <div className="detail-panel__main">
                <h2 className="detail-panel__title">{fragment.title}</h2>
                <p className="detail-panel__detail">{fragment.detail}</p>
                <div className="detail-panel__actions">
                  <button type="button" className="delete-button" onClick={onDelete}>
                    <Eraser aria-hidden="true" size={16} strokeWidth={1.25} />
                    <span>이 조각 지우기</span>
                  </button>
                  <p className="meta">IRREVERSIBLE</p>
                </div>
              </div>

              <div className="detail-panel__aside">
                {view && view.influences.length > 0 && (
                  <div className="detail-panel__group">
                    <h3 className="meta">INFLUENCES</h3>
                    <ul>
                      {view.influences.map(({ from, effects }) => (
                        <li key={from}>
                          <span className="meta">{fragmentById.get(from)?.archiveNo}</span>
                          <span>{withObjectParticle(fragmentById.get(from)?.title ?? '')} 지운 뒤 — {describeEffects(effects)}</span>
                        </li>
                      ))}
                    </ul>
                    {view.summary !== fragment.summary && (
                      <p className="detail-panel__original">
                        처음의 설명: <s>{fragment.summary}</s>
                      </p>
                    )}
                  </div>
                )}

                {connections.length > 0 && (
                  <div className="detail-panel__group">
                    <h3 className="meta">CONNECTIONS</h3>
                    <ul>
                      {connections.map(({ other, label, state }) => (
                        <li key={other.id} data-state={state}>
                          <span className="meta">{other.archiveNo}</span>
                          <span>
                            {other.title} — {label}
                            {state !== 'intact' && <em className="detail-panel__line-state"> ({LINE_WORDS[state]})</em>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="detail-panel__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35 }}
          >
            <p className="meta">NO FRAGMENT SELECTED</p>
            <p>조각 하나를 고르면 그 기록이 이곳에 열립니다.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
