import { useRef, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { fragments, type FragmentId } from '../data/fragments';
import type { BondView } from '../state/derive';
import { useNodePositions } from '../hooks/useNodePositions';
import { pad } from '../utils/format';
import RelationLines, { type Pulse } from './RelationLines';

type Props = {
  deleted: Set<FragmentId>;
  bonds: BondView[];
  pulse?: Pulse | null;
  /** A deleted fragment brought back at the end: present again, but marked as returned. */
  returned?: FragmentId | null;
  /** Deletion order. When given, the "shape of the void" is drawn through the deleted places. */
  voidOrder?: FragmentId[] | null;
  /** Draw the void line progressively (otherwise it appears complete). */
  drawVoid?: boolean;
};

/** The original field in miniature: what remains, and the shapes left by what was deleted. */
export default function TraceMap({ deleted, bonds, pulse = null, returned = null, voidOrder = null, drawVoid = false }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<FragmentId, HTMLElement>());
  const positions = useNodePositions(canvasRef, nodeRefs);

  const voidPoints = voidOrder && positions ? voidOrder.flatMap((id) => positions.centers.get(id) ?? []) : [];
  const voidPath = voidPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div ref={canvasRef} className="trace-map">
      <RelationLines bonds={bonds} positions={positions} activeId={null} pulse={pulse} />
      {fragments.map((f) => {
        const isDeleted = deleted.has(f.id);
        const style = { '--x': f.layout.x, '--y': f.layout.y, '--rotate': f.layout.rotate } as CSSProperties;
        return (
          <div
            key={f.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(f.id, el);
              else nodeRefs.current.delete(f.id);
            }}
            className="trace-map__node"
            data-deleted={isDeleted || undefined}
            data-returned={f.id === returned || undefined}
            style={style}
          >
            <span className="meta">
              <span className="trace-map__mark">× </span>
              {f.id === returned && '↺ '}
              {f.archiveNo}
            </span>
            <span className="trace-map__title">{f.title}</span>
            <span className="visually-hidden">{f.id === returned ? '(되돌아옴)' : isDeleted ? '(삭제됨)' : '(남음)'}</span>
          </div>
        );
      })}

      {positions && voidPoints.length > 0 && (
        // Drawn above the nodes: this line is the one thing on the map that belongs only to this viewer.
        <svg
          className="trace-map__void"
          width={positions.width}
          height={positions.height}
          viewBox={`0 0 ${positions.width} ${positions.height}`}
          aria-hidden="true"
          focusable="false"
        >
          {voidPoints.length > 1 && (
            <motion.path
              d={voidPath}
              initial={drawVoid ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45 * voidPoints.length, ease: 'easeInOut' }}
            />
          )}
          {voidPoints.map((p, i) => (
            <motion.g
              key={i}
              initial={drawVoid ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: drawVoid ? 0.45 * i : 0, duration: 0.3 }}
            >
              <circle cx={p.x} cy={p.y} r={3} />
              <text x={p.x + 7} y={p.y - 7}>
                {pad(i + 1)}
              </text>
            </motion.g>
          ))}
        </svg>
      )}
    </div>
  );
}
