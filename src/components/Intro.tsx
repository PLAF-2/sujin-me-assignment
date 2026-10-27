import { useEffect, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ARCHIVE_ID, MAX_DELETIONS } from '../data/config';
import { fragments } from '../data/fragments';
import { pad } from '../utils/format';
import '../styles/intro.css';

type Props = { onStart: () => void };

const TITLE_LINES = ['존재하지 않는', '나를 삭제하는 법'];
const ERASE_EVERY_MS = 3400;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/** Faint fragment names drifting behind the title; every few seconds one is struck through and fades, then returns. */
function Ghosts() {
  const reduceMotion = useReducedMotion();
  const [erasing, setErasing] = useState<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    let n = 0;
    const timer = window.setInterval(() => {
      // Steps through all fragments in a scattered order (3 is coprime with 8).
      setErasing((n * 3 + 1) % fragments.length);
      n++;
    }, ERASE_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="intro-ghosts" aria-hidden="true">
      {fragments.map((f, i) => (
        <span
          key={erasing === i ? `${f.id}-erasing` : f.id}
          className="intro-ghost"
          data-erasing={erasing === i || undefined}
          style={
            {
              '--x': f.layout.x,
              '--y': f.layout.y,
              '--drift-duration': `${14 + (i % 4) * 3}s`,
              '--drift-delay': `${-i * 2.3}s`,
            } as CSSProperties
          }
        >
          {f.title}
        </span>
      ))}
    </div>
  );
}

export default function Intro({ onStart }: Props) {
  let letter = 0;

  return (
    <motion.main
      className="intro"
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.8 }}
    >
      <Ghosts />

      <motion.header className="intro__meta meta" {...rise(0)}>
        <span>{ARCHIVE_ID}</span>
        <span>EXHIBIT — INTERACTIVE</span>
      </motion.header>

      <div className="intro__body">
        {/* Letters surface one by one; the heading keeps its full name for assistive technology. */}
        <h1 className="intro__title" aria-label={TITLE_LINES.join(' ')}>
          {TITLE_LINES.map((line) => (
            <span key={line} className="intro__title-line" aria-hidden="true">
              {[...line].map((ch) => (
                <motion.span
                  key={letter}
                  className="intro__letter"
                  initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.2, delay: 0.2 + letter++ * 0.045, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch === ' ' ? ' ' : ch}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>

        <motion.p className="intro__lede" {...rise(1.1)}>
          당신을 이루는 것 중 일부를 삭제할 수 있습니다.
          <br />
          단, 삭제한 것이 정말 사라지는지는 알 수 없습니다.
        </motion.p>

        <motion.div {...rise(1.5)}>
          <button type="button" className="intro__start" onClick={onStart}>
            <span>시작하기</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.25} />
          </button>
        </motion.div>
      </div>

      <motion.footer className="intro__footer meta" {...rise(1.8)}>
        <dl>
          <div><dt>FRAGMENTS</dt><dd>{pad(fragments.length)}</dd></div>
          <div><dt>DELETABLE</dt><dd>{pad(MAX_DELETIONS)}</dd></div>
          <div><dt>RECOVERABLE</dt><dd>00</dd></div>
        </dl>
        <p>이 문장들은 진단이 아니라 은유입니다. 당신의 선택은 이 화면 밖으로 전송되지 않습니다.</p>
      </motion.footer>
    </motion.main>
  );
}
