import { useAppState } from '../context/AppStateContext';

const PRESETS = {
  Ash: {
    dotColor: '#e5e5e5',
    bgColor: '#fafafa',
    textColor: '#111111',
    textMuted: '#737373',
    accentDark: '#1a1a1a',
    borderMuted: '#e5e5e5',
  },
  Blush: {
    dotColor: '#e8d4d4',
    bgColor: '#fff5f5',
    textColor: '#111111',
    textMuted: '#7a5c5c',
    accentDark: '#5c2d2d',
    borderMuted: '#e8d4d4',
  },
  Sage: {
    dotColor: '#c5d4c0',
    bgColor: '#f4f7f4',
    textColor: '#111111',
    textMuted: '#4a5c52',
    accentDark: '#1f3b2f',
    borderMuted: '#c5d4c0',
  },
  Midnight: {
    dotColor: '#3d3d47',
    bgColor: '#1a1a2e',
    textColor: '#f0ece0',
    textMuted: '#b8b0a0',
    accentDark: '#e8e0d0',
    borderMuted: '#3d3d4a',
  },
  Sand: {
    dotColor: '#d4c4b0',
    bgColor: '#f5f0e8',
    textColor: '#111111',
    textMuted: '#6b5c4a',
    accentDark: '#3b2e1a',
    borderMuted: '#d4c4b0',
  },
};

export function SettingsPanel({ open, onClose }) {
  const { settings, updateSettings } = useAppState();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/25"
      role="dialog"
      aria-modal="true"
      aria-label="Appearance settings"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-content border-l border-muted-border bg-paper p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Appearance</h2>
          <button
            type="button"
            className="rounded-md border border-muted-border px-3 py-1 text-sm text-muted-fg hover:border-accent hover:text-ink"
            onClick={onClose}
          >
            Done
          </button>
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Presets
        </p>
        <div className="mb-8 flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, v]) => (
            <button
              key={name}
              type="button"
              onClick={() => updateSettings(v)}
              className="rounded-full border border-muted-border bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-ink">Dot color</span>
            <input
              type="color"
              value={settings.dotColor}
              onChange={(e) => updateSettings({ dotColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-muted-border p-0"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-ink">Background</span>
            <input
              type="color"
              value={settings.bgColor}
              onChange={(e) => updateSettings({ bgColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-muted-border p-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
