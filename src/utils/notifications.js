import { plainTextFromHtml } from './timeFormat';
import { toISODate } from './dates';

let timerIds = [];

function clearAll() {
  timerIds.forEach((id) => clearTimeout(id));
  timerIds = [];
}

/**
 * Schedule reminder (6 min before) and at-time notifications for today's tasks with a time.
 * Skips times that have already passed today.
 */
export function scheduleTaskNotifications(tasks) {
  clearAll();
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toISODate(today);
  const now = Date.now();

  tasks.forEach((task) => {
    const t = task.time;
    if (!t || typeof t !== 'string') return;
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return;

    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const target = new Date(today);
    target.setHours(h, min, 0, 0);
    const targetMs = target.getTime();

    if (targetMs <= now) return;

    const name = plainTextFromHtml(task.contentHTML) || 'Task';
    const label = formatLocalTime(h, min);

    const reminderAt = targetMs - 6 * 60 * 1000;
    if (reminderAt > now) {
      const id1 = window.setTimeout(() => {
        try {
          new Notification('⏰ Coming up', {
            body: `${name} at ${label}`,
          });
        } catch {
          /* ignore */
        }
      }, reminderAt - now);
      timerIds.push(id1);
    }

    const id2 = window.setTimeout(() => {
      try {
        new Notification('🔔 Time to', {
          body: name,
        });
      } catch {
        /* ignore */
      }
    }, targetMs - now);
    timerIds.push(id2);
  });
}

function formatLocalTime(h, min) {
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export { clearAll as clearNotificationTimers };
