import { NavLink } from 'react-router-dom';

const item =
  'rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-fg hover:text-ink';
const activeItem = 'text-accent';

export function DesktopNav() {
  return (
    <header className="hidden lg:block">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-7">
        <span className="font-display text-xl text-ink">Memento</span>
        <nav className="flex gap-1" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}>
            Today
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}>
            Tasks
          </NavLink>
          <NavLink
            to="/tracker"
            className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}
          >
            Tracker
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
