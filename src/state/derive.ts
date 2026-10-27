import { fragments, type FragmentId } from '../data/fragments';
import { bonds as rawBonds, type Bond, type Effect, type LineFate } from '../data/relations';
import { validBonds } from '../data/validate';
import type { Deletion } from './reducer';

export const bonds = validBonds(rawBonds);

// Accumulated effects are clamped so no remaining fragment becomes unreadable or overwhelming.
const OPACITY_FLOOR = 0.5;
const SCALE_CEILING = 1.3;

export type Influence = { from: FragmentId; effects: Effect[] };

export type FragmentView = {
  opacity: number;
  scale: number;
  summary: string;
  trembling: boolean;
  /** In deletion order. */
  influences: Influence[];
};

export type LineState = 'intact' | 'severed' | 'frayed' | 'persisting';

export type BondView = { bond: Bond; state: LineState };

export type FieldView = {
  fragments: Map<FragmentId, FragmentView>;
  bonds: BondView[];
};

const LINE_STATE: Record<LineFate, LineState> = { sever: 'severed', fray: 'frayed', persist: 'persisting' };

export const otherEnd = (bond: Bond, id: FragmentId) => (bond.between[0] === id ? bond.between[1] : bond.between[0]);

/** Replays the deletions in order and returns how every fragment and line looks now. */
export function deriveField(deletions: Deletion[]): FieldView {
  const views = new Map<FragmentId, FragmentView>(
    fragments.map((f) => [f.id, { opacity: 1, scale: 1, summary: f.summary, trembling: false, influences: [] }]),
  );
  const lineStates = new Map<string, LineState>(bonds.map((b) => [b.id, 'intact']));

  for (const { id } of deletions) {
    for (const bond of bonds) {
      if (!bond.between.includes(id)) continue;
      const consequence = bond.onDelete[id];
      // A bond without a rule for this side simply breaks.
      lineStates.set(bond.id, LINE_STATE[consequence?.line ?? 'sever']);
      if (!consequence) continue;

      const target = views.get(otherEnd(bond, id));
      if (!target) continue;
      target.influences.push({ from: id, effects: consequence.effects });
      for (const effect of consequence.effects) {
        switch (effect.kind) {
          case 'dim':
            target.opacity = Math.max(OPACITY_FLOOR, target.opacity - effect.amount);
            break;
          case 'swell':
            target.scale = Math.min(SCALE_CEILING, target.scale + effect.amount);
            break;
          case 'rewrite':
            target.summary = effect.summary;
            break;
          case 'tremble':
            target.trembling = true;
            break;
        }
      }
    }
  }

  return {
    fragments: views,
    bonds: bonds.map((bond) => ({ bond, state: lineStates.get(bond.id) ?? 'intact' })),
  };
}

/** Living fragments that deleting `id` would visibly change. */
export function affectedBy(id: FragmentId, deleted: Set<FragmentId>): FragmentId[] {
  return bonds.flatMap((bond) => {
    if (!bond.between.includes(id) || !bond.onDelete[id]) return [];
    const target = otherEnd(bond, id);
    return deleted.has(target) ? [] : [target];
  });
}

const EFFECT_WORDS: Record<Effect['kind'], string> = {
  dim: '흐려짐',
  swell: '커짐',
  rewrite: '설명이 바뀜',
  tremble: '흔들림',
};

export const describeEffects = (effects: Effect[]) => effects.map((e) => EFFECT_WORDS[e.kind]).join(' · ');
