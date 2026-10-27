import { AnimatePresence, motion } from 'framer-motion';
import { fragmentById } from '../data/fragments';
import type { Deletion } from '../state/reducer';
import { pad, formatTime } from '../utils/format';
import '../styles/deletion-log.css';

type Props = { deletions: Deletion[] };

export default function DeletionLog({ deletions }: Props) {
  return (
    <section className="deletion-log" aria-labelledby="deletion-log-title">
      <h2 id="deletion-log-title" className="meta">
        DELETION LOG — {pad(deletions.length)}
      </h2>
      {deletions.length === 0 ? (
        <p className="deletion-log__empty">아직 지운 것이 없습니다.</p>
      ) : (
        <ol className="deletion-log__list">
          <AnimatePresence initial={false}>
            {deletions.map((deletion, i) => {
              const fragment = fragmentById.get(deletion.id);
              if (!fragment) return null;
              return (
                <motion.li
                  key={deletion.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <span className="meta">{pad(i + 1)}</span>
                  <span className="meta">{fragment.archiveNo}</span>
                  <s className="deletion-log__title">{fragment.title}</s>
                  <time className="meta" dateTime={new Date(deletion.at).toISOString()}>
                    {formatTime(deletion.at)}
                  </time>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}
