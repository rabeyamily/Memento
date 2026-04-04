import { DAY_KEYS, DAY_LABELS } from './constants';
import { getDayKey, parseISODate, toISODate } from './dates';

/** True when the task is scheduled every calendar day (interval-1 or all 7 weekdays). */
export function isEverydayRecurrence(recurrence) {
  if (!recurrence) return false;
  if (recurrence.type === 'every_n_days') {
    const n = Math.min(30, Math.max(1, recurrence.interval || 1));
    return n === 1;
  }
  if (recurrence.type === 'days_of_week') {
    const days = recurrence.days || [];
    if (days.length !== 7) return false;
    const set = new Set(days);
    return DAY_KEYS.every((k) => set.has(k));
  }
  return false;
}

export function taskOccursOnDate(recurrence, date) {
  if (!recurrence) return false;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const iso = toISODate(d);
  if (recurrence.startDate && iso < recurrence.startDate) return false;
  if (recurrence.endDate && iso > recurrence.endDate) return false;

  if (recurrence.type === 'days_of_week') {
    const key = getDayKey(d);
    return Array.isArray(recurrence.days) && recurrence.days.includes(key);
  }

  if (recurrence.type === 'every_n_days') {
    const start = parseISODate(recurrence.startDate);
    start.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - start.getTime()) / 86400000);
    if (diff < 0) return false;
    const interval = Math.min(30, Math.max(1, recurrence.interval || 1));
    return diff % interval === 0;
  }

  return false;
}

export function recurrenceSummary(recurrence) {
  if (!recurrence) return '';
  if (recurrence.type === 'days_of_week') {
    const days = recurrence.days || [];
    if (days.length === 0) return 'No days';
    const labels = days.map((k) => DAY_LABELS[k] || k);
    return labels.join(' · ');
  }
  if (recurrence.type === 'every_n_days') {
    const n = Math.min(30, Math.max(1, recurrence.interval || 1));
    return n === 1 ? 'Every day' : `Every ${n} days`;
  }
  return '';
}
