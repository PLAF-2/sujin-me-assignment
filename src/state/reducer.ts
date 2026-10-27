import { MAX_DELETIONS } from '../data/config';
import type { FragmentId } from '../data/fragments';

export type Phase = 'intro' | 'field' | 'ending';

export type Deletion = {
  id: FragmentId;
  /** Epoch ms, passed in by the caller so the reducer stays pure. */
  at: number;
};

export type State = {
  phase: Phase;
  selectedId: FragmentId | null;
  confirming: boolean;
  /** In deletion order. Nothing is ever removed from this list. */
  deletions: Deletion[];
  /** Fragments whose deletion was cancelled at the confirm step, in order (may repeat). */
  hesitations: FragmentId[];
};

export type Action =
  | { type: 'start' }
  | { type: 'select'; id: FragmentId | null }
  | { type: 'requestDelete' }
  | { type: 'cancelDelete' }
  | { type: 'confirmDelete'; at: number }
  | { type: 'end' }
  | { type: 'restart' };

export const initialState: State = { phase: 'intro', selectedId: null, confirming: false, deletions: [], hesitations: [] };

export const isDeleted = (state: State, id: FragmentId) => state.deletions.some((d) => d.id === id);

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...initialState, phase: 'field' };

    case 'select':
      // A deleted fragment cannot be selected again, and selection is frozen while confirming.
      if (state.confirming || (action.id && isDeleted(state, action.id))) return state;
      return { ...state, selectedId: action.id };

    case 'requestDelete':
      if (!state.selectedId || state.deletions.length >= MAX_DELETIONS) return state;
      return { ...state, confirming: true };

    case 'cancelDelete':
      if (!state.confirming || !state.selectedId) return { ...state, confirming: false };
      return { ...state, confirming: false, hesitations: [...state.hesitations, state.selectedId] };

    case 'confirmDelete': {
      const id = state.selectedId;
      if (!id || isDeleted(state, id) || state.deletions.length >= MAX_DELETIONS) {
        return { ...state, confirming: false };
      }
      return {
        ...state,
        selectedId: null,
        confirming: false,
        deletions: [...state.deletions, { id, at: action.at }],
      };
    }

    case 'end':
      return { ...state, phase: 'ending', selectedId: null, confirming: false };

    case 'restart':
      return initialState;
  }
}
