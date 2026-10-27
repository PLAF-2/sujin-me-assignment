import { useLayoutEffect, useState, type RefObject } from 'react';
import type { FragmentId } from '../data/fragments';

export type Point = { x: number; y: number };
export type Positions = { centers: Map<FragmentId, Point>; width: number; height: number };

/**
 * Centers of each fragment slot relative to the field. Uses offset* metrics, which
 * ignore CSS transforms, so entry animations and tilts don't skew the lines.
 */
export function useNodePositions(
  fieldRef: RefObject<HTMLElement | null>,
  slotRefs: RefObject<Map<FragmentId, HTMLElement>>,
): Positions | null {
  const [positions, setPositions] = useState<Positions | null>(null);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const slots = slotRefs.current;
    if (!field) return;

    const measure = () => {
      const centers = new Map<FragmentId, Point>();
      slots.forEach((el, id) => {
        centers.set(id, { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 });
      });
      setPositions({ centers, width: field.offsetWidth, height: field.offsetHeight });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    slots.forEach((el) => observer.observe(el));
    // Web fonts change text metrics after first paint.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [fieldRef, slotRefs]);

  return positions;
}
