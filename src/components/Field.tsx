import { useEffect, useMemo, useRef, useState, type Dispatch, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { ARCHIVE_ID, MAX_DELETIONS } from '../data/config';
import { fragmentById, fragments, type FragmentId } from '../data/fragments';
import type { Action, State } from '../state/reducer';
import { affectedBy, deriveField, otherEnd } from '../state/derive';
import { useNodePositions } from '../hooks/useNodePositions';
import { pad } from '../utils/format';
import FragmentNode, { type Dimming } from './FragmentNode';
import DetailPanel, { type Connection } from './DetailPanel';
import RelationLines from './RelationLines';
import ConfirmDelete from './ConfirmDelete';
import DeletionLog from './DeletionLog';
import '../styles/field.css';

type Props = {
  state: State;
  dispatch: Dispatch<Action>;
};

// Time for the last deletion to finish fading before the ending takes over.
const ENDING_DELAY_MS = 2800;

const NAV_KEYS: Record<string, (i: number, n: number) => number> = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowDown: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  ArrowUp: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
};

export default function Field({ state, dispatch }: Props) {
  const { selectedId, confirming, deletions } = state;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fieldRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef(new Map<FragmentId, HTMLElement>());
  const positions = useNodePositions(fieldRef, slotRefs);
  // Fragment index to focus once a deletion has re-rendered the field.
  const pendingFocus = useRef<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const selected = selectedId ? (fragmentById.get(selectedId) ?? null) : null;
  const deletedIds = new Set(deletions.map((d) => d.id));
  const alive = fragments.flatMap((f, i) => (deletedIds.has(f.id) ? [] : [i]));
  const remaining = alive.length;
  const finished = deletions.length >= MAX_DELETIONS || remaining === 0;
  // Roving tabindex: exactly one living fragment is in the tab order.
  const tabbableIndex = alive.includes(focusIndex) ? focusIndex : alive[0];

  const view = useMemo(() => deriveField(deletions), [deletions]);
  const lastDeletion = deletions.at(-1);
  const pulse = lastDeletion ? { from: lastDeletion.id, key: deletions.length } : null;

  // A faint light that follows a mouse pointer (not touch): written straight to CSS variables, no re-render.
  const moveLight = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    e.currentTarget.style.setProperty('--light-x', `${e.clientX}px`);
    e.currentTarget.style.setProperty('--light-y', `${e.clientY}px`);
    e.currentTarget.dataset.lit = 'true';
  };
  const connections: Connection[] = selectedId
    ? view.bonds.flatMap(({ bond, state }) => {
        if (!bond.between.includes(selectedId)) return [];
        const other = fragmentById.get(otherEnd(bond, selectedId));
        return other ? [{ other, label: bond.label, state }] : [];
      })
    : [];
  const connectedIds = new Set(connections.map((c) => c.other.id));
  const dimmingOf = (id: FragmentId): Dimming =>
    !selectedId || id === selectedId ? 'none' : connectedIds.has(id) ? 'near' : 'far';

  const select = (id: State['selectedId']) => dispatch({ type: 'select', id });
  const focusFragment = (index: number | undefined) => {
    if (index !== undefined) buttonRefs.current[index]?.focus();
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Escape closes the record and hands focus back to its fragment (the dialog handles its own Escape).
  useEffect(() => {
    if (!selectedId || confirming) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      dispatch({ type: 'select', id: null });
      focusFragment(fragments.findIndex((f) => f.id === selectedId));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedId, confirming, dispatch]);

  // Runs after ConfirmDelete (a child) has closed the dialog, so this focus wins.
  useEffect(() => {
    if (pendingFocus.current === null) return;
    focusFragment(pendingFocus.current);
    pendingFocus.current = null;
  }, [deletions]);

  useEffect(() => {
    if (!finished) return;
    const timer = window.setTimeout(() => dispatch({ type: 'end' }), ENDING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [finished, dispatch]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = NAV_KEYS[e.key];
    if (!move || alive.length === 0) return;
    e.preventDefault();
    const position = Math.max(0, alive.indexOf(tabbableIndex));
    const next = alive[move(position, alive.length)];
    setFocusIndex(next);
    focusFragment(next);
  };

  // Keep both the record and the fragment it describes on screen.
  const handlePanelOpen = (panel: HTMLElement) => {
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (getComputedStyle(panel).position === 'fixed') {
      // Mobile sheet: lift the selected fragment above the sheet's top edge.
      const index = fragments.findIndex((f) => f.id === selectedId);
      const button = buttonRefs.current[index];
      if (!button) return;
      const overlap = button.getBoundingClientRect().bottom - panel.getBoundingClientRect().top + 16;
      if (overlap > 0) window.scrollBy({ top: overlap, behavior });
    } else if (panel.getBoundingClientRect().bottom > window.innerHeight) {
      // Desktop strip below the fold on short screens: scroll just enough to show it.
      panel.scrollIntoView({ block: 'nearest', behavior });
    }
  };

  const closePanel = () => {
    select(null);
    focusFragment(tabbableIndex);
  };

  const confirmDelete = () => {
    if (!selected) return;
    const index = fragments.indexOf(selected);
    const rest = alive.filter((i) => i !== index);
    const left = rest.length;
    // Continue from the next living fragment in reading order, or the heading if none are left.
    const next = rest.find((i) => i > index) ?? rest[0];
    const changed = affectedBy(selected.id, deletedIds).map((id) => fragmentById.get(id)?.title);
    const ripple = changed.length > 0 ? ` 연결된 조각에 변화가 생겼습니다: ${changed.join(', ')}.` : '';

    dispatch({ type: 'confirmDelete', at: Date.now() });
    if (next !== undefined) {
      setFocusIndex(next);
      pendingFocus.current = next;
    } else {
      headingRef.current?.focus();
    }
    setAnnouncement(
      deletions.length + 1 >= MAX_DELETIONS
        ? `삭제됨: ${selected.title}. 남은 조각은 ${left}개입니다.${ripple} 곧 결말로 넘어갑니다.`
        : `삭제됨: ${selected.title}. 남은 조각 ${left}개.${ripple}`,
    );
  };

  return (
    <motion.main
      className="field-screen"
      data-has-selection={selected ? true : undefined}
      onPointerMove={moveLight}
      onPointerLeave={(e) => delete e.currentTarget.dataset.lit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.8 }}
    >
      <header className="field-header">
        <div className="field-header__id">
          <p className="meta">{ARCHIVE_ID} / FIELD</p>
          <h1 ref={headingRef} tabIndex={-1} className="field-header__title">
            자아 조각 <span className="meta">{pad(fragments.length)} FRAGMENTS</span>
          </h1>
        </div>
        <div className="field-header__status">
          <dl className="meta">
            <div><dt>DELETED</dt><dd>{pad(deletions.length)} / {pad(MAX_DELETIONS)}</dd></div>
            <div><dt>REMAINING</dt><dd>{pad(remaining)}</dd></div>
          </dl>
          <button type="button" className="text-button" onClick={() => dispatch({ type: 'end' })} disabled={finished}>
            여기서 멈추기
          </button>
        </div>
      </header>

      <p id="field-hint" className="visually-hidden">
        방향키로 조각 사이를 이동하고, Enter로 선택합니다. Esc로 기록을 닫습니다.
      </p>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>

      <div
        ref={fieldRef}
        className="field"
        role="group"
        aria-label="자아 조각"
        aria-describedby="field-hint"
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          // Clicking the empty space of the field releases the selection.
          if (e.target === e.currentTarget) select(null);
        }}
      >
        <RelationLines bonds={view.bonds} positions={positions} activeId={selectedId} pulse={pulse} />
        {fragments.map((fragment, index) => (
          <FragmentNode
            key={fragment.id}
            fragment={fragment}
            view={view.fragments.get(fragment.id)!}
            index={index}
            deleted={deletedIds.has(fragment.id)}
            selected={fragment.id === selectedId}
            dimming={dimmingOf(fragment.id)}
            tabbable={index === tabbableIndex}
            slotRef={(el) => {
              if (el) slotRefs.current.set(fragment.id, el);
              else slotRefs.current.delete(fragment.id);
            }}
            buttonRef={(el) => {
              buttonRefs.current[index] = el;
            }}
            onSelect={() => select(fragment.id === selectedId ? null : fragment.id)}
            onFocus={() => setFocusIndex(index)}
          />
        ))}
      </div>

      <div className="field-footer">
        <DetailPanel
          fragment={selected}
          view={selectedId ? (view.fragments.get(selectedId) ?? null) : null}
          connections={connections}
          onClose={closePanel}
          onDelete={() => dispatch({ type: 'requestDelete' })}
          onOpen={handlePanelOpen}
        />
        <DeletionLog deletions={deletions} />
      </div>

      <div className="field-light" aria-hidden="true" />

      <ConfirmDelete
        fragment={selected}
        open={confirming}
        onCancel={() => dispatch({ type: 'cancelDelete' })}
        onConfirm={confirmDelete}
      />
    </motion.main>
  );
}
