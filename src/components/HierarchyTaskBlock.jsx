import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskOccursOnDate } from '../utils/recurrence';
import { formatTimeBadge } from '../utils/timeFormat';
import { getDayKey, toISODate } from '../utils/dates';
import { sortTasksForDate } from '../utils/tracker';
import { DraggableTaskList } from './DraggableTaskList';
import { SafeRichText } from './SafeRichText';
import { TaskCheckbox } from './TaskCheckbox';

function stripForEmptyCheck(html) {
  if (!html) return '';
  const tmp = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  return tmp.replace(/\u00a0/g, ' ').trim();
}

export function HierarchyTaskBlock({
  today,
  categories,
  subcategories,
  tasks,
  completions,
  toggleCompletion,
  reorderTasksInGroup,
  deleteTask,
}) {
  const navigate = useNavigate();
  const [armedDeleteTaskId, setArmedDeleteTaskId] = useState(null);
  const iso = toISODate(today);
  const dayKey = getDayKey(today);
  const map = completions[iso] || {};

  const pairKeys = new Set();
  const pairs = [];
  for (const t of tasks) {
    if (!taskOccursOnDate(t.recurrence, today)) continue;
    const key = `${t.categoryId}\0${t.subcategoryId}`;
    if (pairKeys.has(key)) continue;
    pairKeys.add(key);
    const cat = categories.find((c) => c.id === t.categoryId);
    const sub = subcategories.find((s) => s.id === t.subcategoryId);
    if (cat && sub) pairs.push({ cat, sub });
  }
  pairs.sort((a, b) => {
    const c = a.cat.name.localeCompare(b.cat.name);
    if (c !== 0) return c;
    return a.sub.name.localeCompare(b.sub.name);
  });

  const blocks = pairs
    .map(({ cat, sub }) => {
      const pool = tasks.filter(
        (t) =>
          t.categoryId === cat.id &&
          t.subcategoryId === sub.id &&
          taskOccursOnDate(t.recurrence, today)
      );
      const ordered = sortTasksForDate(pool, today);
      if (ordered.length === 0) return null;
      return { cat, sub, ordered };
    })
    .filter(Boolean);

  if (blocks.length === 0) return null;

  const byCategory = new Map();
  blocks.forEach((b) => {
    if (!byCategory.has(b.cat.id)) byCategory.set(b.cat.id, { cat: b.cat, subs: [] });
    byCategory.get(b.cat.id).subs.push({ sub: b.sub, ordered: b.ordered });
  });

  return (
    <div className="space-y-4">
      {[...byCategory.values()].map(({ cat, subs }) => {
        const catHead = (cat.name || '').trim();
        return (
        <section
          key={cat.id}
          className="rounded-xl border border-muted-border bg-paper/90 pl-1.5"
        >
          <div className="border-l-4 border-accent py-3 pl-2 pr-2">
            {catHead ? (
              <h2 className="font-display text-lg font-medium leading-tight text-ink">
                {catHead}
              </h2>
            ) : null}
            <div className={catHead ? 'mt-0 space-y-3' : 'space-y-3'}>
              {subs.map(({ sub, ordered }) => {
                const subHead = (sub.name || '').trim();
                return (
                <div key={sub.id}>
                  {subHead ? (
                    <div className="mb-1.5">
                      <span className="inline-flex max-w-full rounded-md border border-muted-border bg-paper/95 px-2.5 py-1 text-base font-medium leading-snug text-ink">
                        {subHead}
                      </span>
                    </div>
                  ) : null}
                  <DraggableTaskList
                    compact
                    dayKey={dayKey}
                    orderedTasks={ordered}
                    onReorder={(ids) =>
                      reorderTasksInGroup(cat.id, sub.id, dayKey, ids)
                    }
                    renderRow={(task, { dragHandle }) => {
                      const checked = !!map[task.id];
                      const empty = !stripForEmptyCheck(task.contentHTML);
                      const timeLabel = formatTimeBadge(task.time);
                      const armedDelete = armedDeleteTaskId === task.id;
                      return (
                        <div className="flex w-full min-w-0 items-start gap-1.5 text-base leading-snug text-ink">
                          <div className="flex shrink-0 items-start gap-0.5 pt-0.5">
                            {dragHandle}
                            <TaskCheckbox
                              checked={checked}
                              onToggle={() => toggleCompletion(task.id, today)}
                              disabled={empty}
                            />
                          </div>
                          <div
                            className={`min-w-0 flex-1 pr-1 ${
                              checked
                                ? 'text-muted-fg line-through decoration-accent decoration-2'
                                : ''
                            }`}
                          >
                            {empty ? (
                              <span className="text-muted-fg">(Untitled)</span>
                            ) : (
                              <SafeRichText html={task.contentHTML} />
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {timeLabel ? (
                              <span className="rounded-full border border-muted-border px-2 py-0.5 text-[11px] tabular-nums leading-none text-muted-fg">
                                {timeLabel}
                              </span>
                            ) : null}
                            <div className="flex shrink-0 items-center gap-0">
                              <button
                                type="button"
                                className="p-1 text-muted-fg transition-colors hover:text-accent"
                                aria-label="Edit task"
                                onClick={() => {
                                  setArmedDeleteTaskId(null);
                                  navigate(`/tasks?edit=${encodeURIComponent(task.id)}`);
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className={`p-1 transition-colors ${
                                  armedDelete
                                    ? 'text-red-600'
                                    : 'text-muted-fg hover:text-red-600/90'
                                }`}
                                aria-label={
                                  armedDelete ? 'Tap again to delete task' : 'Delete task'
                                }
                                onClick={() => {
                                  if (armedDelete) {
                                    deleteTask(task.id);
                                    setArmedDeleteTaskId(null);
                                  } else {
                                    setArmedDeleteTaskId(task.id);
                                  }
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              );
              })}
            </div>
          </div>
        </section>
        );
      })}
    </div>
  );
}
