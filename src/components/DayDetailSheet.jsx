import { formatLongDate, getDayKey } from '../utils/dates';
import { DAY_LABELS } from '../utils/constants';
import { SafeRichText } from './SafeRichText';
import { TaskCheckbox } from './TaskCheckbox';

export function DayDetailSheet({
  open,
  date,
  onClose,
  breakdown,
  onToggleTask,
  readOnly,
}) {
  const ro = readOnly === true;
  if (!open || !date) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 lg:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Day details"
      onClick={onClose}
    >
      <div
        className="max-h-[min(70vh,520px)] w-full max-w-content overflow-y-auto rounded-t-2xl border border-muted-border bg-paper p-5 lg:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl text-ink">{formatLongDate(date)}</p>
            <p className="mt-1 text-sm text-muted-fg">{DAY_LABELS[getDayKey(date)]}</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-muted-border px-3 py-1 text-sm text-muted-fg transition-colors hover:border-accent hover:text-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {breakdown.length === 0 ? (
          <p className="text-sm text-muted-fg">No tasks scheduled this day.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {breakdown.map(({ task, done }) => (
              <li
                key={task.id}
                className="flex items-start gap-2 border-b border-muted-border pb-2 text-base leading-relaxed last:border-0 last:pb-0"
              >
                {ro ? (
                  <span
                    className="mt-[0.2em] flex h-5 w-5 shrink-0 items-center justify-center rounded border border-muted-border text-[10px] text-accent"
                    aria-hidden
                  >
                    {done ? '✓' : ''}
                  </span>
                ) : (
                  <span className="mt-[0.2em] shrink-0">
                    <TaskCheckbox
                      checked={done}
                      onToggle={() => onToggleTask?.(task.id, date)}
                    />
                  </span>
                )}
                <div
                  className={`min-w-0 flex-1 transition-all duration-200 ${
                    done
                      ? 'text-muted-fg line-through decoration-accent decoration-2'
                      : ''
                  }`}
                >
                  <SafeRichText html={task.contentHTML} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
