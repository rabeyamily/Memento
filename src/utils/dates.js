import { DAY_KEYS, DAY_LABELS } from './constants';

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function toISODate(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

export function parseISODate(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/** 0 = Sunday … 6 = Saturday */
export function getDayKey(date) {
  return DAY_KEYS[date.getDay()];
}

export function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** e.g. "Friday—April 3" (narrow separator, no wide spaces around the dash) */
export function formatHomeDate(date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const rest = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  return `${weekday}\u2014${rest}`;
}

export function formatShortDayDate(date) {
  const w = DAY_LABELS[getDayKey(date)];
  const rest = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${w} ${rest}`;
}

/** Next calendar occurrence of `dayKey` on or after `from` (inclusive). */
export function nextOccurrenceOnOrAfter(dayKey, from = new Date()) {
  const want = DAY_KEYS.indexOf(dayKey);
  if (want < 0) return new Date(from);
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    if (d.getDay() === want) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function eachDayInMonth(year, monthIndex) {
  const days = [];
  const cur = new Date(year, monthIndex, 1);
  while (cur.getMonth() === monthIndex) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function startOfWeekMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** e.g. "Mon, Apr 6 – Sun, Apr 12" for the Monday–Sunday week containing `date`. */
export function formatWeekRangeMondaySun(date = new Date()) {
  const start = startOfWeekMonday(date);
  const end = addDays(start, 6);
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}
