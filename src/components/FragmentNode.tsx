import { Fragment as ReactFragment, type CSSProperties, type Ref } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { Fragment } from '../data/fragments';
import type { FragmentView } from '../state/derive';
import { seededRandom } from '../utils/random';

export type Dimming = 'none' | 'near' | 'far';

type Props = {
  fragment: Fragment;
  view: FragmentView;
  index: number;
  deleted: boolean;
  selected: boolean;
  dimming: Dimming;
  tabbable: boolean;
  slotRef: Ref<HTMLDivElement>;
  buttonRef: Ref<HTMLButtonElement>;
  onSelect: () => void;
  onFocus: () => void;
};

// Deletion: the summary fades first, then the title comes apart letter by letter, then the box goes.
const fragmentVariants: Variants = {
  gone: { opacity: 0, transition: { delay: 1.15, duration: 0.45 } },
};
const fadeVariants: Variants = {
  gone: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.6 } },
};
const letterVariants: Variants = {
  gone: (seed: number) => ({
    opacity: 0,
    x: (seed - 0.5) * 18,
    y: -8 - seed * 16,
    filter: 'blur(6px)',
    transition: { duration: 0.9, delay: 0.15 + seed * 0.45, ease: [0.4, 0, 0.6, 1] },
  }),
};

export default function FragmentNode(props: Props) {
  const { fragment, view, index, deleted, selected, dimming, tabbable, slotRef, buttonRef, onSelect, onFocus } = props;
  const { x, y, scale, rotate } = fragment.layout;
  const style = { '--x': x, '--y': y, '--scale': scale, '--rotate': rotate } as CSSProperties;
  const altered = view.influences.length > 0;

  // The slot keeps its place in the field; inside it, the fragment gives way to its trace.
  return (
    <motion.div
      ref={slotRef}
      className="fragment-slot"
      style={style}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.25 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {deleted ? (
          <motion.div
            key="trace"
            className="fragment-trace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1 }}
          >
            <FragmentText fragment={fragment} summary={fragment.summary} />
            <span className="visually-hidden">(삭제됨)</span>
          </motion.div>
        ) : (
          <motion.button
            key="fragment"
            ref={buttonRef}
            type="button"
            className="fragment"
            data-selected={selected || undefined}
            data-dimmed={dimming === 'none' ? undefined : dimming}
            tabIndex={tabbable ? 0 : -1}
            aria-pressed={selected}
            aria-controls="detail-panel"
            // Letters are split into spans for the dissolve; give the button its name explicitly.
            aria-label={`${fragment.archiveNo} ${fragment.title}. ${view.summary}${altered ? ' (변화가 생긴 조각)' : ''}`}
            onClick={onSelect}
            onFocus={onFocus}
            variants={fragmentVariants}
            exit="gone"
          >
            {/* Relational effects live on their own layer so they never fight the selection dimming. */}
            <span
              className="fragment__effect"
              data-tremble={view.trembling || undefined}
              style={{ opacity: view.opacity, '--boost': view.scale } as CSSProperties}
            >
              <FragmentText fragment={fragment} summary={view.summary} altered={altered} dissolvable salt={index} />
            </span>
            {/* Re-keyed on every new influence, so it flashes once when a ripple arrives. */}
            {altered && <span key={view.influences.length} className="fragment__hit" aria-hidden="true" />}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type TextProps = { fragment: Fragment; summary: string; altered?: boolean; dissolvable?: boolean; salt?: number };

// Shared by the living fragment and its trace, so the trace occupies exactly the same shape.
function FragmentText({ fragment, summary, altered = false, dissolvable = false, salt = 0 }: TextProps) {
  let letterIndex = 0;
  const title = dissolvable
    ? fragment.title.split(' ').map((word, w) => (
        // Words stay unbreakable; letters inside them can scatter independently.
        <ReactFragment key={w}>
          {w > 0 && ' '}
          <span className="fragment__word">
            {[...word].map((ch) => {
              const seed = seededRandom(letterIndex++, salt);
              return (
                <motion.span key={letterIndex} className="fragment__letter" custom={seed} variants={letterVariants}>
                  {ch}
                </motion.span>
              );
            })}
          </span>
        </ReactFragment>
      ))
    : fragment.title;

  return (
    <span className="fragment__inner">
      <motion.span className="fragment__no meta" variants={fadeVariants}>
        {fragment.archiveNo}
        {altered && <span className="fragment__altered">ALTERED</span>}
      </motion.span>
      <span className="fragment__title">{title}</span>
      {/* Keyed by text so a rewritten summary fades in as a new sentence. */}
      <motion.span
        key={summary}
        className="fragment__summary"
        data-rewritten={summary !== fragment.summary || undefined}
        variants={fadeVariants}
      >
        {summary}
      </motion.span>
    </span>
  );
}
