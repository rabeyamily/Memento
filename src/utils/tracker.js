import {
  addDays,
  getDayKey,
  nextOccurrenceOnOrAfter,
  startOfWeekMonday,
  toISODate,
} from './dates';
import { taskOccursOnDate } from './recurrence';

export function tasksForDate(tasks, date) {
  return tasks.filter((t) => taskOccursOnDate(t.recurrence, date));
}

export function sortTasksForDate(tasks, date) {
  const iso = toISODate(date);
  return [...tasks].sort((a, b) => {
    const oa = a.order?.[iso] ?? 1e9;
    const ob = b.order?.[iso] ?? 1e9;
    if (oa !== ob) return oa - ob;
    return a.id.localeCompare(b.id);
  });
}

/** Tasks in a weekday group: occur on the next calendar occurrence of `dayKey` from `from`. */
export function tasksForWeekdayGroup(tasks, dayKey, from = new Date()) {
  const anchor = nextOccurrenceOnOrAfter(dayKey, from);
  return tasks.filter((t) => taskOccursOnDate(t.recurrence, anchor));
}

export function sortTasksForWeekdayGroup(tasks, dayKey, from = new Date()) {
  const anchor = nextOccurrenceOnOrAfter(dayKey, from);
  return sortTasksForDate(tasksForWeekdayGroup(tasks, dayKey, from), anchor);
}

export function anchorDateForWeekday(dayKey, from = new Date()) {
  return nextOccurrenceOnOrAfter(dayKey, from);
}

export function dayCompletionState(tasks, completions, date) {
  const key = toISODate(date);
  const due = tasksForDate(tasks, date);
  if (due.length === 0) return 'none';
  const map = completions[key] || {};
  let done = 0;
  due.forEach((t) => {
    if (map[t.id]) done += 1;
  });
  if (done === 0) return 'empty';
  if (done === due.length) return 'full';
  return 'partial';
}

export function computeStreak(tasks, completions, today = new Date()) {
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 400; i++) {
    const due = tasksForDate(tasks, cursor);
    if (due.length === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const key = toISODate(cursor);
    const map = completions[key] || {};
    const allDone = due.every((t) => map[t.id]);
    if (!allDone) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Current calendar week (Mon–Sun) containing `today`. */
export function weekCompletionRatio(tasks, completions, today = new Date()) {
  const start = startOfWeekMonday(today);
  return weekCompletionRatioForWeek(tasks, completions, start);
}

/** Total scheduled task instances Mon–Sun vs completed for that week. */
export function weekCompletionRatioForWeek(tasks, completions, weekStart) {
  let total = 0;
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const due = tasksForDate(tasks, d);
    if (due.length === 0) continue;
    const key = toISODate(d);
    const map = completions[key] || {};
    due.forEach((t) => {
      total += 1;
      if (map[t.id]) done += 1;
    });
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function breakdownForDate(tasks, completions, date) {
  const due = sortTasksForDate(tasksForDate(tasks, date), date);
  const key = toISODate(date);
  const map = completions[key] || {};
  return due.map((t) => ({
    task: t,
    done: !!map[t.id],
  }));
}

/** True if `weekStart` is the Monday of the week containing `ref` (default: today). */
export function isSameWeekAsReference(weekStart, ref = new Date()) {
  const a = startOfWeekMonday(ref);
  return toISODate(a) === toISODate(weekStart);
}
