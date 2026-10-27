import { motion } from 'framer-motion';
import type { FragmentId } from '../data/fragments';
import { otherEnd, type BondView } from '../state/derive';
import type { Point, Positions } from '../hooks/useNodePositions';
import '../styles/relation-lines.css';

/** A deletion that just happened: light travels from it along each of its bonds. */
export type Pulse = { from: FragmentId; key: number };

type Props = {
  bonds: BondView[];
  positions: Positions | null;
  activeId: FragmentId | null;
  pulse?: Pulse | null;
};

// How much of a severed line remains at each end.
const STUB = 0.14;
const SEVER_TRANSITION = { duration: 1.1, delay: 0.5, ease: [0.4, 0, 0.2, 1] as const };
const PULSE_TRANSITION = { duration: 1.1, delay: 0.4, ease: [0.4, 0, 0.2, 1] as const, times: [0, 0.15, 0.85, 1] };

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// Purely decorative: the same relations are described in text in the detail panel.
export default function RelationLines({ bonds, positions, activeId, pulse = null }: Props) {
  if (!positions) return null;

  return (
    <svg
      className="relation-lines"
      width={positions.width}
      height={positions.height}
      viewBox={`0 0 ${positions.width} ${positions.height}`}
      aria-hidden="true"
      focusable="false"
    >
      {bonds.map(({ bond, state }) => {
        const a = positions.centers.get(bond.between[0]);
        const b = positions.centers.get(bond.between[1]);
        if (!a || !b) return null;
        const className = `bond bond--${state}${activeId && bond.between.includes(activeId) ? ' bond--active' : ''}`;

        if (state === 'severed') {
          // The line splits in the middle and each half withdraws toward its own fragment.
          const mid = lerp(a, b, 0.5);
          const a2 = lerp(a, b, STUB);
          const b2 = lerp(b, a, STUB);
          return (
            <g key={bond.id} className={className}>
              <motion.line x1={a.x} y1={a.y} initial={{ x2: mid.x, y2: mid.y }} animate={{ x2: a2.x, y2: a2.y }} transition={SEVER_TRANSITION} />
              <motion.line x1={b.x} y1={b.y} initial={{ x2: mid.x, y2: mid.y }} animate={{ x2: b2.x, y2: b2.y }} transition={SEVER_TRANSITION} />
            </g>
          );
        }
        return (
          <g key={bond.id} className={className}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          </g>
        );
      })}

      {pulse &&
        bonds.map(({ bond }) => {
          if (!bond.between.includes(pulse.from)) return null;
          const from = positions.centers.get(pulse.from);
          const to = positions.centers.get(otherEnd(bond, pulse.from));
          if (!from || !to) return null;
          return (
            <motion.circle
              key={`${pulse.key}-${bond.id}`}
              className="bond-pulse"
              r={2.5}
              initial={{ cx: from.x, cy: from.y, opacity: 0 }}
              animate={{ cx: to.x, cy: to.y, opacity: [0, 1, 1, 0] }}
              transition={PULSE_TRANSITION}
            />
          );
        })}
    </svg>
  );
}
