import { useState } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';
import { DotBackground } from './DotBackground';
import { NotificationBootstrap } from './NotificationBootstrap';
import { SettingsPanel } from './SettingsPanel';

export function AppLayout({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <DotBackground>
      <div className="relative">
        <NotificationBootstrap />
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="fixed right-4 top-4 z-50 inline-flex items-center justify-center p-2 text-ink transition-opacity hover:opacity-70 lg:right-[max(1rem,calc(50%-240px+1rem))]"
          aria-label="Settings"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <DesktopNav />
        <main className="mx-auto max-w-content px-5 pb-28 pt-[4.25rem] sm:pt-16 lg:pb-12 lg:pt-5">
          {children}
        </main>
        <BottomNav />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </DotBackground>
  );
}
