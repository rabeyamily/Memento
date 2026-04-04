import { useEffect, useId, useRef } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) {
  const titleId = useId();
  const descId = useId();
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);

    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-[1] w-full max-w-md rounded-2xl border border-muted-border bg-paper p-6 shadow-xl"
      >
        <h2 id={titleId} className="font-display text-xl text-ink">
          {title}
        </h2>
        <p id={descId} className="mt-3 text-sm leading-relaxed text-muted-fg">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] rounded-full border border-muted-border bg-paper px-4 text-sm font-medium text-ink"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`min-h-[40px] rounded-full px-4 text-sm font-semibold ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-accent text-[#111] hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
