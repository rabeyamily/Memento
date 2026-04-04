import { addDays, toISODate } from '../utils/dates';
import { breakdownForDate, dayCompletionState } from '../utils/tracker';
import { SafeRichText } from './SafeRichText';

function Dot({ state }) {
  if (state === 'none') {
    return <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-muted-border/60" />;
  }
  if (state === 'empty') {
    return <span className="mx-auto block h-2 w-2 rounded-full border border-muted-border bg-transparent" />;
  }
  if (state === 'partial') {
    return (
      <span className="relative mx-auto block h-2 w-2 overflow-hidden rounded-full border border-accent bg-white">
        <span className="absolute inset-y-0 left-0 w-1/2 bg-accent" aria-hidden />
      </span>
    );
  }
  return <span className="mx-auto block h-2 w-2 rounded-full bg-accent" />;
}

export function WeekStrip({ weekStart, tasks, completions }) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((d) => {
        const iso = toISODate(d);
        const isToday = toISODate(new Date()) === iso;
        const state = dayCompletionState(tasks, completions, d);
        const breakdown = breakdownForDate(tasks, completions, d);
        const label = d.toLocaleDateString(undefined, { weekday: 'short' });
        const num = d.getDate();

        return (
          <div
            key={iso}
            className={`rounded-lg border border-muted-border bg-white/80 px-3 py-3 ${
              isToday ? 'ring-1 ring-accent/40' : ''
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className={`text-sm font-medium ${isToday ? 'text-accent' : 'text-ink'}`}>
                  {label} {num}
                </p>
                <p className="text-[11px] text-muted-fg">{iso}</p>
              </div>
              <Dot state={state} />
            </div>
            {breakdown.length === 0 ? (
              <p className="text-xs text-muted-fg">No tasks</p>
            ) : (
              <ul className="space-y-2">
                {breakdown.map(({ task, done }) => (
                  <li key={task.id} className="flex items-start gap-2 text-sm">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-muted-border text-[10px] text-accent"
                      aria-hidden
                    >
                      {done ? '✓' : ''}
                    </span>
                    <span
                      className={
                        done
                          ? 'text-muted-fg line-through decoration-accent decoration-1'
                          : 'text-ink'
                      }
                    >
                      <SafeRichText html={task.contentHTML} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
