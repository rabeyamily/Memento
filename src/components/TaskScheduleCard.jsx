import { useRef } from 'react';
import { DAY_KEYS, DAY_LABELS } from '../utils/constants';
import { parseISODate, toISODate } from '../utils/dates';

const DAY_LETTER = {
  sun: 'Su',
  mon: 'Mo',
  tue: 'Tu',
  wed: 'We',
  thu: 'Th',
  fri: 'Fr',
  sat: 'Sa',
};

const DAY_PRESETS = [
  { key: 'sat', label: 'Sat', days: ['sat'] },
  { key: 'sun', label: 'Sun', days: ['sun'] },
  { key: 'weekend', label: 'Weekend', days: ['sat', 'sun'] },
  { key: 'weekdays', label: 'Mon–Fri', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
];

function sameDaySelection(selected, presetDays) {
  const a = new Set(selected || []);
  const b = new Set(presetDays);
  if (a.size !== b.size) return false;
  for (const d of b) if (!a.has(d)) return false;
  return true;
}

function formatDateLabel(iso) {
  if (!iso) return '—';
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TaskScheduleCard({
  recurrence,
  onChange,
  taskTime,
  onTaskTimeChange,
  timeExpanded,
  onTimeExpandedChange,
}) {
  const r = recurrence;
  const set = (patch) => onChange({ ...r, ...patch });

  const startRef = useRef(null);
  const endRef = useRef(null);

  const toggleDay = (d) => {
    const next = new Set(r.days || []);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    set({ days: [...next] });
  };

  const bumpInterval = (delta) => {
    const n = Math.min(30, Math.max(1, (r.interval || 1) + delta));
    set({ interval: n });
  };

  const openPicker = (ref) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  };

  const startVal = r.startDate || toISODate(new Date());

  return (
    <div className="space-y-5">
      <input
        ref={startRef}
        type="date"
        value={startVal}
        onChange={(e) => set({ startDate: e.target.value })}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <input
        ref={endRef}
        type="date"
        value={r.endDate || ''}
        onChange={(e) => set({ endDate: e.target.value || null })}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      <div className="flex flex-wrap justify-center gap-1 rounded-full border border-muted-border bg-paper p-0.5">
        <button
          type="button"
          onClick={() => set({ type: 'days_of_week' })}
          className={`rounded-full px-3 py-1 text-[11px] font-medium leading-none transition-colors ${
            r.type === 'days_of_week'
              ? 'bg-accent text-[#111] shadow-sm'
              : 'text-muted-fg hover:text-ink'
          }`}
        >
          Days of week
        </button>
        <button
          type="button"
          onClick={() => set({ type: 'every_n_days', interval: r.interval || 1 })}
          className={`rounded-full px-3 py-1 text-[11px] font-medium leading-none transition-colors ${
            r.type === 'every_n_days'
              ? 'bg-accent text-[#111] shadow-sm'
              : 'text-muted-fg hover:text-ink'
          }`}
        >
          Every N days
        </button>
      </div>

      {r.type === 'days_of_week' && (
        <>
          <p className="text-[10px] leading-snug text-muted-fg">
            Tap a day below, or use a quick preset (e.g. every Saturday, weekend only).
          </p>
          <div className="flex flex-wrap gap-1">
            {DAY_PRESETS.map((p) => {
              const active = sameDaySelection(r.days, p.days);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => set({ type: 'days_of_week', days: [...p.days] })}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none transition-colors ${
                    active
                      ? 'border-accent bg-accent text-[#111]'
                      : 'border-muted-border bg-paper text-muted-fg hover:border-accent/50 hover:text-ink'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DAY_KEYS.map((d) => {
              const on = (r.days || []).includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  title={DAY_LABELS[d]}
                  onClick={() => toggleDay(d)}
                  className={`flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg border px-1.5 text-[10px] font-semibold leading-none transition-colors ${
                    on
                      ? 'border-accent bg-accent text-[#111]'
                      : 'border-muted-border bg-paper text-muted-fg hover:border-accent/50'
                  }`}
                >
                  {DAY_LETTER[d]}
                </button>
              );
            })}
          </div>
        </>
      )}

      {r.type === 'every_n_days' && (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => bumpInterval(-1)}
              className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-muted-border bg-paper text-lg font-light text-ink"
              aria-label="Decrease interval"
            >
              −
            </button>
            <span className="min-w-[2.5ch] text-center text-xl font-semibold tabular-nums text-ink">
              {r.interval || 1}
            </span>
            <button
              type="button"
              onClick={() => bumpInterval(1)}
              className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-muted-border bg-paper text-lg font-light text-ink"
              aria-label="Increase interval"
            >
              +
            </button>
          </div>
          <div className="w-full">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#999]">
              Starting from
            </p>
            <button
              type="button"
              onClick={() => openPicker(startRef)}
              className="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg border border-muted-border bg-paper px-2.5 py-1.5 text-left text-[11px] text-ink"
            >
              <span>{formatDateLabel(startVal)}</span>
              <CalendarGlyph className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {r.type === 'days_of_week' && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#999]">
              Start date
            </p>
            <button
              type="button"
              onClick={() => openPicker(startRef)}
              className="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg border border-muted-border bg-paper px-2.5 py-1.5 text-left text-[11px] text-ink"
            >
              <span>{formatDateLabel(startVal)}</span>
              <CalendarGlyph className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#999]">
              End date (optional)
            </p>
            <button
              type="button"
              onClick={() => openPicker(endRef)}
              className="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg border border-muted-border bg-paper px-2.5 py-1.5 text-left text-[11px] text-ink"
            >
              <span>{r.endDate ? formatDateLabel(r.endDate) : 'No end'}</span>
              <CalendarGlyph className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {r.type === 'every_n_days' && (
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#999]">
            End date (optional)
          </p>
          <button
            type="button"
            onClick={() => openPicker(endRef)}
            className="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg border border-muted-border bg-paper px-2.5 py-1.5 text-left text-[11px] text-ink"
          >
            <span>{r.endDate ? formatDateLabel(r.endDate) : 'No end'}</span>
            <CalendarGlyph className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="border-t border-muted-border pt-3">
        {!timeExpanded ? (
          <button
            type="button"
            onClick={() => onTimeExpandedChange(true)}
            className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-1 text-left text-[11px] text-muted-fg transition-colors hover:text-ink"
          >
            <ClockGlyph className="h-4 w-4" />
            <span>Add time</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <ClockGlyph className="h-4 w-4 text-muted-fg" />
            <input
              type="time"
              value={taskTime}
              onChange={(e) => onTaskTimeChange(e.target.value)}
              className="min-h-[36px] flex-1 rounded-lg border border-muted-border bg-paper px-2 py-1.5 text-[11px] text-ink"
            />
            <button
              type="button"
              onClick={() => {
                onTaskTimeChange('');
                onTimeExpandedChange(false);
              }}
              className="text-[11px] text-muted-fg underline"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarGlyph({ className = 'h-4 w-4 shrink-0 text-muted-fg' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockGlyph({ className = 'h-5 w-5 shrink-0' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
