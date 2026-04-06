# Memento

A small, single-user **habit and task tracker** that runs entirely in the browser. Plan recurring tasks with flexible schedules, organize them with categories and subcategories, check them off on **Today**, and review progress on a **month or week** calendar—all stored locally on your device.

## Features

- **Today** — See everything due today, grouped by category and subcategory. Drag to reorder, tap to complete, optional delete.
- **Tasks** — Rich text editor (bold, italic, colors, highlights), category chips with inline add/delete, and scheduling:
  - Specific **days of the week** (with quick presets such as weekend or weekdays)
  - **Every N days** from a start date
  - Optional time-of-day; optional end date where applicable
- **Tracker** — Month grid and week strip, completion breakdown per day, streak counter, week completion percentage.
- **Appearance** — Settings (gear) with theme presets; dots and colors follow CSS variables so the UI stays cohesive.
- **Reminders** — With permission granted, the **Notification API** schedules a short heads-up (about six minutes before) and an at-time ping for **today’s** tasks that include a time.
- **Privacy** — No account, no server: data lives in **`localStorage`** only.

## Tech stack

- [React 18](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite 6](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [DOMPurify](https://github.com/cure53/DOMPurify) for sanitizing rich HTML

## Getting started

**Requirements:** Node.js 18+ (or any version compatible with Vite 6).

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start dev server with HMR      |
| `npm run build`   | Production build to `dist/`    |
| `npm run preview` | Serve the production build locally |

## Deploying to GitHub Pages

This repo’s Vite config uses a **`base`** of `/Memento/` when building for GitHub Pages. Build with the environment variable set, then publish the `dist` output (for example via GitHub Actions or manual upload):

```bash
GITHUB_PAGES=true npm run build
```

Adjust `repoBase` in `vite.config.js` if your repository name or Pages URL path differs.

**GitHub Pages settings:** Settings → Pages → **Source** must be **GitHub Actions** (not “Deploy from a branch”). After the first successful run of **Deploy static content to Pages**, the site URL appears on that settings page.

If the live site is blank and the console shows **`main.jsx` 404**, the wrong HTML is being served (branch deploy). Use Actions as above, then **Actions** → open the latest workflow → confirm it’s green. If a **github-pages** environment waits for approval, approve it under **Settings → Environments**.

## Project structure

```
src/
  App.jsx                 # Routes + splash gate
  main.jsx
  pages/                  # Today, Tasks, Tracker
  components/             # Layout, editors, calendar, dialogs, nav
  context/                # App state, toasts
  utils/                  # Dates, recurrence, tracker logic, sanitize, notifications
```

Persistent keys are defined in `src/utils/constants.js` (`STORAGE_KEYS`).

## Data and backups

All tasks, completions, categories, and settings are saved under **`localStorage`**. Clearing site data or using another browser profile starts fresh. For a backup, use your browser’s dev tools → Application → Local Storage, or export keys that start with `memento_`.

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source the repo.
