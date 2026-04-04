import { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';

export function DotBackground({ children, className = '' }) {
  const { settings } = useAppState();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--dot-color', settings.dotColor || '#e5e5e5');
    root.style.setProperty('--bg-color', settings.bgColor || '#fafafa');
    root.style.setProperty('--text-color', settings.textColor || '#111111');
    root.style.setProperty('--text-muted', settings.textMuted || '#737373');
    root.style.setProperty('--accent-dark', settings.accentDark || '#111111');
    root.style.setProperty('--border-muted', settings.borderMuted || '#e5e5e5');
  }, [
    settings.dotColor,
    settings.bgColor,
    settings.textColor,
    settings.textMuted,
    settings.accentDark,
    settings.borderMuted,
  ]);

  return (
    <div className={`min-h-dvh bg-dot-grid ${className}`}>{children}</div>
  );
}
