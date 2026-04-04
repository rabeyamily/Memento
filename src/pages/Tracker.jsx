import { useMemo, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { DayDetailSheet } from '../components/DayDetailSheet';
import { MonthGrid } from '../components/MonthGrid';
import { StreakCounter } from '../components/StreakCounter';
import { WeekStrip } from '../components/WeekStrip';
import { addDays, startOfWeekMonday } from '../utils/dates';
import {
  breakdownForDate,
  computeStreak,
  isSameWeekAsReference,
  weekCompletionRatioForWeek,
} from '../utils/tracker';

export function Tracker() {
  const { tasks, completions, toggleCompletion } = useAppState();
  const [view, setView] = useState('month');
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [weekCursor, setWeekCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(null);

  const monthDate = useMemo(() => {
    const d = new Date(monthCursor);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [monthCursor]);

  const weekStart = useMemo(
    () => startOfWeekMonday(weekCursor),
    [weekCursor]
  );

  const streak = useMemo(
    () => computeStreak(tasks, completions, new Date()),
    [tasks, completions]
  );

  const weekPctCurrent = useMemo(
    () => weekCompletionRatioForWeek(tasks, completions, startOfWeekMonday(new Date())),
    [tasks, completions]
  );

  const weekPctView = useMemo(
    () => weekCompletionRatioForWeek(tasks, completions, weekStart),
    [tasks, completions, weekStart]
  );

  const breakdown = selected
    ? breakdownForDate(tasks, completions, selected)
    : [];

  const monthTitleOnly = monthDate.toLocaleDateString(undefined, {
    month: 'long',
  });

  const weekHeading = isSameWeekAsReference(weekStart, new Date())
    ? 'This Week'
    : `Week of ${weekStart.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
      })}`;

  const shiftMonth = (delta) => {
    setMonthCursor((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
    setSelected(null);
  };

  const shiftWeek = (delta) => {
    setWeekCursor((prev) => addDays(prev, delta * 7));
  };

  const goTodayWeek = () => {
    setWeekCursor(new Date());
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl leading-snug text-ink">Habit tracker</h1>
        <p className="mt-3 text-sm text-muted-fg">Month & week views</p>
      </div>

      <div className="flex flex-wrap gap-0.5 rounded-lg border border-muted-border bg-paper p-0.5">
        <button
          type="button"
          onClick={() => {
            setView('month');
            setSelected(null);
          }}
          className={`min-h-[36px] flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
            view === 'month' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'text-muted-fg'
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => {
            setView('week');
            setSelected(null);
          }}
          className={`min-h-[36px] flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
            view === 'week' ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'text-muted-fg'
          }`}
        >
          Week
        </button>
      </div>

      <StreakCounter days={streak} />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-fg">
            {view === 'week' ? weekHeading : 'This week'}
          </span>
          <span className="tabular-nums text-sm text-ink">
            {view === 'week' ? weekPctView : weekPctCurrent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-muted-border bg-paper">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{
              width: `${view === 'week' ? weekPctView : weekPctCurrent}%`,
            }}
          />
        </div>
      </div>

      {view === 'month' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md border border-muted-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="font-display text-2xl text-ink">{monthTitleOnly}</h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md border border-muted-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent"
              aria-label="Next month"
            >
              →
            </button>
          </div>
          <MonthGrid
            tasks={tasks}
            completions={completions}
            monthDate={monthDate}
            selected={selected}
            onSelectDay={(d) => setSelected(d)}
          />
        </>
      )}

      {view === 'week' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                className="rounded-md border border-muted-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent"
                aria-label="Previous week"
              >
                ←
              </button>
              <h2 className="font-display text-xl text-ink">{weekHeading}</h2>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                className="rounded-md border border-muted-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent"
                aria-label="Next week"
              >
                →
              </button>
            </div>
            <button
              type="button"
              onClick={goTodayWeek}
              className="rounded-md border border-muted-border px-3 py-1.5 text-sm text-ink hover:border-accent"
            >
              Today
            </button>
          </div>
          <WeekStrip weekStart={weekStart} tasks={tasks} completions={completions} />
        </>
      )}

      <DayDetailSheet
        open={selected != null && view === 'month'}
        date={selected}
        onClose={() => setSelected(null)}
        breakdown={breakdown}
        onToggleTask={(taskId, date) => toggleCompletion(taskId, date)}
      />
    </div>
  );
}
