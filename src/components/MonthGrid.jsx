import { useMemo } from 'react';
import { eachDayInMonth, toISODate } from '../utils/dates';
import { dayCompletionState } from '../utils/tracker';

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

export function MonthGrid({ tasks, completions, monthDate, selected, onSelectDay }) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const days = useMemo(
    () => eachDayInMonth(year, monthIndex),
    [year, monthIndex]
  );

  const startPad = days[0].getDay();
  const cells = [];
  for (let i = 0; i < startPad; i++) {
    cells.push(<div key={`pad-${i}`} className="min-h-[44px]" />);
  }
  days.forEach((d) => {
    const iso = toISODate(d);
    const isToday = toISODate(new Date()) === iso;
    const state = dayCompletionState(tasks, completions, d);
    const active = selected && toISODate(selected) === iso;
    cells.push(
      <button
        key={iso}
        type="button"
        onClick={() => onSelectDay(d)}
        className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md border text-xs transition-colors ${
          active
            ? 'border-accent bg-white'
            : 'border-transparent hover:border-muted-border hover:bg-white/80'
        } ${isToday ? 'ring-1 ring-accent/40' : ''}`}
      >
        <span className={`tabular-nums ${isToday ? 'font-semibold text-accent' : 'text-ink'}`}>
          {d.getDate()}
        </span>
        <Dot state={state} />
      </button>
    );
  });

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-fg">
        {weekdayLabels.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
