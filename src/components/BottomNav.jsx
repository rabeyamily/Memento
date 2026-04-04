import { NavLink } from 'react-router-dom';

const linkBase =
  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors';

function IconHome({ active }) {
  return (
    <svg
      className={active ? 'text-accent' : 'text-muted-fg'}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}

function IconTasks({ active }) {
  return (
    <svg
      className={active ? 'text-accent' : 'text-muted-fg'}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconTracker({ active }) {
  return (
    <svg
      className={active ? 'text-accent' : 'text-muted-fg'}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M10 4v18" />
    </svg>
  );
}

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-muted-border bg-paper/95 backdrop-blur-sm lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-content justify-around">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-accent' : 'text-muted-fg'}`
          }
        >
          {({ isActive }) => (
            <>
              <IconHome active={isActive} />
              Home
            </>
          )}
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-accent' : 'text-muted-fg'}`
          }
        >
          {({ isActive }) => (
            <>
              <IconTasks active={isActive} />
              Tasks
            </>
          )}
        </NavLink>
        <NavLink
          to="/tracker"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-accent' : 'text-muted-fg'}`
          }
        >
          {({ isActive }) => (
            <>
              <IconTracker active={isActive} />
              Tracker
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
