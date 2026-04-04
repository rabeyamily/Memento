import { useMemo, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { HierarchyTaskBlock } from '../components/HierarchyTaskBlock';
import { formatHomeDate } from '../utils/dates';
import { tasksForDate } from '../utils/tracker';

export function Home() {
  const {
    tasks,
    categories,
    subcategories,
    completions,
    toggleCompletion,
    reorderTasksInGroup,
    deleteTask,
  } = useAppState();

  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const hasTasksToday = useMemo(
    () => tasksForDate(tasks, today).length > 0,
    [tasks, today]
  );

  const showNotifyBanner =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'denied';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl leading-snug text-ink sm:text-5xl">
          {formatHomeDate(today)}
        </h1>
        <p className="mt-3 text-sm text-muted-fg">Today&apos;s habits</p>
      </div>

      {showNotifyBanner && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-muted-border bg-paper px-4 py-3 text-sm text-ink">
          <span>Enable notifications to get task reminders</span>
          <button
            type="button"
            className="rounded-md border border-accent bg-accent/10 px-3 py-1 text-sm font-medium text-ink"
            onClick={() => Notification.requestPermission()}
          >
            Enable
          </button>
        </div>
      )}

      <div>
        {!hasTasksToday ? (
          <p className="text-center text-sm text-muted-fg">
            Nothing scheduled today. Add a task with a matching recurrence in Tasks.
          </p>
        ) : (
          <HierarchyTaskBlock
            today={today}
            categories={categories}
            subcategories={subcategories}
            tasks={tasks}
            completions={completions}
            toggleCompletion={toggleCompletion}
            reorderTasksInGroup={reorderTasksInGroup}
            deleteTask={deleteTask}
          />
        )}
      </div>
    </div>
  );
}
