import { DAY_KEYS, DAY_LABELS } from '../utils/constants';
import { toISODate } from '../utils/dates';

const defaultRecurrence = () => ({
  type: 'days_of_week',
  days: ['mon'],
  interval: 1,
  startDate: toISODate(new Date()),
  endDate: null,
});

export function RecurrenceBuilder({ value, onChange }) {
  const r = value || defaultRecurrence();

  const set = (patch) => onChange({ ...r, ...patch });

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

  return (
    <div className="space-y-5 rounded-lg border border-muted-border bg-white/80 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        Schedule
      </p>

      <div className="flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="rec-mode"
            checked={r.type === 'days_of_week'}
            onChange={() => set({ type: 'days_of_week' })}
            className="accent-accent"
          />
          Specific days
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="rec-mode"
            checked={r.type === 'every_n_days'}
            onChange={() => set({ type: 'every_n_days', interval: r.interval || 1 })}
            className="accent-accent"
          />
          Every N days
        </label>
      </div>

      {r.type === 'days_of_week' && (
        <div className="flex flex-wrap gap-2">
          {DAY_KEYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                (r.days || []).includes(d)
                  ? 'border-accent bg-white text-ink ring-1 ring-accent/30'
                  : 'border-muted-border bg-white/60 text-muted-fg'
              }`}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      )}

      {r.type === 'every_n_days' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-fg">Every</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded border border-muted-border bg-white text-lg"
            onClick={() => bumpInterval(-1)}
            aria-label="Decrease interval"
          >
            −
          </button>
          <span className="min-w-[2ch] text-center font-medium tabular-nums">
            {r.interval || 1}
          </span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded border border-muted-border bg-white text-lg"
            onClick={() => bumpInterval(1)}
            aria-label="Increase interval"
          >
            +
          </button>
          <span className="text-sm text-muted-fg">day(s)</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-fg">Start date</span>
          <input
            type="date"
            value={r.startDate || toISODate(new Date())}
            onChange={(e) => set({ startDate: e.target.value })}
            className="w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-fg">End date (optional)</span>
          <input
            type="date"
            value={r.endDate || ''}
            onChange={(e) =>
              set({ endDate: e.target.value || null })
            }
            className="w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
