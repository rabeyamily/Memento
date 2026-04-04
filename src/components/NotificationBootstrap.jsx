import { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
  clearNotificationTimers,
  scheduleTaskNotifications,
} from '../utils/notifications';

export function NotificationBootstrap() {
  const { tasks } = useAppState();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    scheduleTaskNotifications(tasks);
    return () => clearNotificationTimers();
  }, [tasks]);

  return null;
}
