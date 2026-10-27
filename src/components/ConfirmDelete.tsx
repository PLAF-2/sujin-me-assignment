import { useEffect, useRef } from 'react';
import type { Fragment } from '../data/fragments';

type Props = {
  fragment: Fragment | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Native modal <dialog>: the browser traps focus, makes the page inert and handles Esc.
export default function ConfirmDelete({ fragment, open, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onCancel={(e) => {
        // Keep React state as the source of truth for whether the dialog is open.
        e.preventDefault();
        onCancel();
      }}
    >
      {fragment && (
        <div className="confirm__inner">
          <p className="meta">CONFIRM / {fragment.archiveNo}</p>
          <h2 id="confirm-title" className="confirm__title">
            이 조각을 지우시겠습니까?
          </h2>
          <p className="confirm__fragment">{fragment.title}</p>
          <p id="confirm-body" className="confirm__body">
            지운 조각은 되돌릴 수 없습니다. 다만 그것이 있던 자리는 남습니다.
          </p>
          <div className="confirm__actions">
            {/* Cancel is focused first so an accidental Enter does not delete. */}
            <button type="button" className="confirm__cancel" onClick={onCancel} autoFocus>
              그대로 두기
            </button>
            <button type="button" className="confirm__delete" onClick={onConfirm}>
              지우기
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
