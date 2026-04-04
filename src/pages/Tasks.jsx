import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { DEFAULT_CATEGORY_ID, DEFAULT_SUBCATEGORY_ID } from '../utils/constants';
import { getDayKey, toISODate } from '../utils/dates';
import { formatTimeBadge } from '../utils/timeFormat';
import { recurrenceSummary } from '../utils/recurrence';
import { sanitizePlainText } from '../utils/sanitize';
import { sortTasksForDate } from '../utils/tracker';
import { CategoryBadge } from '../components/CategoryBadge';
import { CategoryPillChips } from '../components/CategoryPillChips';
import { DraggableTaskList } from '../components/DraggableTaskList';
import { RichTextEditor } from '../components/RichTextEditor';
import { SafeRichText } from '../components/SafeRichText';
import { SubcategoryBadge } from '../components/SubcategoryBadge';
import { TaskScheduleCard } from '../components/TaskScheduleCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

function stripForEmptyCheck(html) {
  if (!html) return '';
  const tmp = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  return tmp.replace(/\u00a0/g, ' ').trim();
}

function normalizeRecurrence(r) {
  const startDate = r.startDate || toISODate(new Date());
  const endDate = r.endDate || null;
  if (r.type === 'every_n_days') {
    return {
      type: 'every_n_days',
      interval: Math.min(30, Math.max(1, r.interval || 1)),
      startDate,
      endDate,
    };
  }
  return {
    type: 'days_of_week',
    days: Array.isArray(r.days) ? r.days : [],
    startDate,
    endDate,
  };
}

const defaultRec = () => ({
  type: 'days_of_week',
  days: ['mon'],
  interval: 1,
  startDate: toISODate(new Date()),
  endDate: null,
});

export function Tasks() {
  const {
    categories,
    subcategories,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    reorderTasksInGroup,
    addCategory,
    addSubcategory,
    ensureSubcategoryForCategory,
    renameCategory,
    renameSubcategory,
    deleteCategory,
    deleteSubcategory,
  } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get('edit');

  const [draftHtml, setDraftHtml] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [initialHtml, setInitialHtml] = useState('');
  const [categoryId, setCategoryId] = useState(() => categories[0]?.id ?? DEFAULT_CATEGORY_ID);
  const [subcategoryId, setSubcategoryId] = useState(
    () => subcategories.find((s) => s.categoryId === categories[0]?.id)?.id ?? ''
  );
  const [recurrence, setRecurrence] = useState(defaultRec);
  const [editingId, setEditingId] = useState(null);
  const [taskTime, setTaskTime] = useState('');
  const [timeExpanded, setTimeExpanded] = useState(false);
  const [armedDeleteTaskId, setArmedDeleteTaskId] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const lastEditQuery = useRef(null);

  const today = new Date();
  const todayDayKey = getDayKey(today);

  useEffect(() => {
    const subs = subcategories.filter((s) => s.categoryId === categoryId);
    const valid = subs.some((s) => s.id === subcategoryId);
    if (!valid && subs[0]) setSubcategoryId(subs[0].id);
  }, [categoryId, subcategories, subcategoryId]);

  const catName = (id) => categories.find((c) => c.id === id)?.name ?? '';
  const subName = (id) => subcategories.find((s) => s.id === id)?.name ?? '';

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  /** Ensures subcategory belongs to category (avoids “orphan” tasks that match no list section). */
  const resolveSubcategoryForSave = (catId, currentSubId) => {
    const subs = [...subcategories]
      .filter((s) => s.categoryId === catId)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (subs.some((s) => s.id === currentSubId)) return currentSubId;
    if (subs[0]) return subs[0].id;
    const row = ensureSubcategoryForCategory(catId);
    return row?.id ?? DEFAULT_SUBCATEGORY_ID;
  };

  const resetForm = () => {
    setDraftHtml('');
    setInitialHtml('');
    setEditorKey((k) => k + 1);
    setRecurrence(defaultRec());
    setEditingId(null);
    setCategoryId(categories[0]?.id ?? DEFAULT_CATEGORY_ID);
    const firstSub = subcategories.find(
      (s) => s.categoryId === (categories[0]?.id ?? DEFAULT_CATEGORY_ID)
    );
    setSubcategoryId(firstSub?.id ?? '');
    setTaskTime('');
    setTimeExpanded(false);
    navigate('/tasks', { replace: true });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!stripForEmptyCheck(draftHtml)) return;
    const rec = normalizeRecurrence(recurrence);
    if (rec.type === 'days_of_week' && rec.days.length === 0) return;

    const timeVal = taskTime.trim() || null;
    const subId = resolveSubcategoryForSave(categoryId, subcategoryId);
    if (subId !== subcategoryId) setSubcategoryId(subId);

    if (editingId) {
      updateTask(editingId, {
        contentHTML: draftHtml,
        categoryId,
        subcategoryId: subId,
        recurrence: rec,
        time: timeVal,
      });
      resetForm();
      return;
    }

    addTask({
      contentHTML: draftHtml,
      categoryId,
      subcategoryId: subId,
      recurrence: rec,
      time: timeVal,
    });
    showToast('Task added!');
    setFlashSuccess(true);
    setTimeout(() => setFlashSuccess(false), 900);
    setDraftHtml('');
    setInitialHtml('');
    setEditorKey((k) => k + 1);
    setRecurrence(defaultRec());
    setTaskTime('');
    setTimeExpanded(false);
    navigate('/tasks', { replace: true });
  };

  const startEdit = useCallback((task) => {
    setEditingId(task.id);
    setDraftHtml(task.contentHTML);
    setInitialHtml(task.contentHTML);
    setEditorKey((k) => k + 1);
    setCategoryId(task.categoryId);
    setSubcategoryId(task.subcategoryId);
    const t = task.time || '';
    setTaskTime(t);
    setTimeExpanded(Boolean(t && t.trim()));
    const r = task.recurrence || defaultRec();
    setRecurrence({
      type: r.type,
      days: r.days || ['mon'],
      interval: r.interval || 1,
      startDate: r.startDate || toISODate(new Date()),
      endDate: r.endDate ?? null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!editParam) {
      lastEditQuery.current = null;
      return;
    }
    if (lastEditQuery.current === editParam) return;
    const t = tasks.find((x) => x.id === editParam);
    if (!t) return;
    startEdit(t);
    lastEditQuery.current = editParam;
  }, [editParam, tasks, startEdit]);

  const onDeleteCategory = (id) => {
    if (id === DEFAULT_CATEGORY_ID) return;
    setDeletePrompt({ type: 'category', id });
  };

  const onDeleteSub = (id) => {
    setDeletePrompt({ type: 'sub', id });
  };

  const confirmDelete = useCallback(() => {
    if (!deletePrompt) return;
    const p = deletePrompt;
    setDeletePrompt(null);
    if (p.type === 'category') {
      if (p.id === DEFAULT_CATEGORY_ID) return;
      const wasSelected = categoryId === p.id;
      deleteCategory(p.id);
      if (wasSelected) setCategoryId(DEFAULT_CATEGORY_ID);
    } else {
      deleteSubcategory(p.id);
    }
  }, [deletePrompt, categoryId, deleteCategory, deleteSubcategory]);

  const deleteDialogCopy =
    deletePrompt?.type === 'category'
      ? {
          title: 'Delete category?',
          message:
            'Tasks in this category will become uncategorized (no category label). Subcategories under it will be removed.',
        }
      : deletePrompt?.type === 'sub'
        ? {
            title: 'Delete subcategory?',
            message:
              'Tasks that use this subcategory will be reassigned to another subcategory in the same category.',
          }
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-12 pb-24">
      <div className="flex flex-col gap-3">
        <header className="flex flex-wrap items-baseline gap-4">
          <h1 className="font-display text-[32px] leading-snug text-ink">Tasks</h1>
          <span className="rounded-full border border-muted-border bg-paper px-2.5 py-1 text-xs font-medium tabular-nums text-muted-fg">
            {tasks.length} tasks
          </span>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <RichTextEditor
            variant="card"
            resetKey={editorKey}
            initialHtml={initialHtml}
            onChange={setDraftHtml}
            placeholder="What's the task?"
          />
        </div>

        <div className="rounded-xl border border-muted-border bg-paper p-5">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wide text-[#999]">
            Category (optional)
          </p>
          <CategoryPillChips
            categoryId={categoryId}
            subcategoryId={subcategoryId}
            onCategoryChange={setCategoryId}
            onSubcategoryChange={setSubcategoryId}
            categories={categories}
            subcategories={subcategories}
            onAddCategory={addCategory}
            onAddSubcategory={addSubcategory}
            onEnsureSubcategory={ensureSubcategoryForCategory}
            onDeleteCategory={onDeleteCategory}
            onDeleteSubcategory={onDeleteSub}
            defaultCategoryId={DEFAULT_CATEGORY_ID}
          />
        </div>

        <div className="rounded-xl border border-muted-border bg-paper p-5">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wide text-[#999]">
            Schedule
          </p>
          <TaskScheduleCard
            recurrence={recurrence}
            onChange={setRecurrence}
            taskTime={taskTime}
            onTaskTimeChange={setTaskTime}
            timeExpanded={timeExpanded}
            onTimeExpandedChange={setTimeExpanded}
          />
        </div>

        <button
          type="submit"
          className={`submit-task-btn inline-flex h-10 min-h-[40px] w-full max-w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors sm:mx-auto sm:w-auto sm:min-w-[12rem] ${
            flashSuccess
              ? 'bg-green-600 text-white'
              : 'bg-[#f59e0b] text-[#111] hover:bg-[#ea9b0d]'
          }`}
        >
          {flashSuccess ? (
            <>
              <svg
                className="h-5 w-5 animate-[pulse_0.6s_ease-out]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden
              >
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Added
            </>
          ) : editingId ? (
            'Save changes'
          ) : (
            <>
              Add task
              <span aria-hidden>→</span>
            </>
          )}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="min-h-[44px] rounded-xl border border-muted-border py-3 text-sm font-medium text-ink"
          >
            Cancel edit
          </button>
        )}
        </form>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-muted-border" />
        <h2 className="shrink-0 font-display text-xl text-ink">Your tasks</h2>
        <div className="h-px flex-1 bg-muted-border" />
      </div>

      <section className="space-y-12">
        {sortedCats.flatMap((cat) => {
          const subs = subcategories
            .filter((s) => s.categoryId === cat.id)
            .sort((a, b) => a.name.localeCompare(b.name));
          return subs
            .map((sub) => {
              const pool = tasks.filter(
                (t) => t.categoryId === cat.id && t.subcategoryId === sub.id
              );
              if (pool.length === 0) return null;
              const ordered = sortTasksForDate(pool, today);
              const catHeading = (cat.name || '').trim();
              const subHeading = (sub.name || '').trim();
              return (
                <div key={`${cat.id}-${sub.id}`}>
                  {(catHeading || subHeading) && (
                    <div className="mb-4">
                      {catHeading ? (
                        <h3 className="font-display text-lg text-ink">{catHeading}</h3>
                      ) : null}
                      {subHeading ? (
                        <p className="mt-1 text-sm text-muted-fg">{subHeading}</p>
                      ) : null}
                    </div>
                  )}
                  <div className="rounded-xl border border-muted-border bg-paper/80">
                    <DraggableTaskList
                      dayKey={todayDayKey}
                      orderedTasks={ordered}
                      onReorder={(ids) =>
                        reorderTasksInGroup(cat.id, sub.id, todayDayKey, ids)
                      }
                      renderRow={(task, { dragHandle }) => {
                        const armed = armedDeleteTaskId === task.id;
                        const summary = recurrenceSummary(task.recurrence);
                        const badgeCat = (catName(task.categoryId) || '').trim();
                        const badgeSub = (subName(task.subcategoryId) || '').trim();
                        const showBadges = Boolean(badgeCat || badgeSub);
                        return (
                          <div className="flex w-full min-w-0 items-center gap-3">
                            <div className="flex shrink-0 items-center self-stretch">{dragHandle}</div>
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => startEdit(task)}
                            >
                              <div className="text-base text-ink">
                                <SafeRichText html={task.contentHTML} />
                              </div>
                              <p className="mt-1 text-xs text-muted-fg">{summary}</p>
                            </button>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              {showBadges && (
                                <div className="flex flex-wrap justify-end gap-1">
                                  {badgeCat ? <CategoryBadge name={badgeCat} /> : null}
                                  {badgeSub ? <SubcategoryBadge name={badgeSub} /> : null}
                                </div>
                              )}
                              {formatTimeBadge(task.time) && (
                                <span className="rounded-full border border-muted-border px-2 py-0.5 text-[11px] tabular-nums text-muted-fg">
                                  {formatTimeBadge(task.time)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (armed) {
                                  deleteTask(task.id);
                                  setArmedDeleteTaskId(null);
                                } else {
                                  setArmedDeleteTaskId(task.id);
                                }
                              }}
                              className={`shrink-0 p-2 transition-colors ${
                                armed
                                  ? 'text-red-600'
                                  : 'text-muted-fg hover:text-red-600/90'
                              }`}
                              aria-label={armed ? 'Tap again to delete' : 'Delete task'}
                            >
                              <svg
                                width="20"
                                height="20"
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
                        );
                      }}
                    />
                  </div>
                </div>
              );
            })
            .filter(Boolean);
        })}
        {tasks.length === 0 && (
          <p className="text-center text-sm text-muted-fg">No tasks yet. Add one above.</p>
        )}
      </section>

      <section className="border-t border-muted-border pt-12">
        <button
          type="button"
          onClick={() => setManagerOpen((o) => !o)}
          className="flex min-h-[48px] w-full items-center justify-between gap-3 text-left"
        >
          <h2 className="font-display text-xl text-ink">Categories &amp; subcategories</h2>
          <span className="text-sm text-muted-fg">{managerOpen ? 'Hide' : 'Manage'}</span>
        </button>
        {managerOpen && (
          <div className="mt-6 space-y-5">
            {sortedCats.map((cat) => {
              const subs = subcategories
                .filter((s) => s.categoryId === cat.id)
                .sort((a, b) => a.name.localeCompare(b.name));
              return (
                <div key={cat.id} className="rounded-xl border border-muted-border bg-paper p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={cat.name}
                      onChange={(e) =>
                        renameCategory(cat.id, sanitizePlainText(e.target.value))
                      }
                      placeholder={
                        cat.id === DEFAULT_CATEGORY_ID
                          ? 'Leave blank to show tasks without a category title'
                          : undefined
                      }
                      className="min-h-[44px] min-w-[8rem] flex-1 rounded-lg border border-muted-border px-2 py-2 font-medium text-ink"
                    />
                    {cat.id !== DEFAULT_CATEGORY_ID && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-xs text-red-600"
                      >
                        Delete category
                      </button>
                    )}
                  </div>
                  <ul className="mt-3 space-y-2 pl-2">
                    {subs.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center gap-2">
                        <input
                          value={s.name}
                          onChange={(e) =>
                            renameSubcategory(s.id, sanitizePlainText(e.target.value))
                          }
                          placeholder={
                            s.id === DEFAULT_SUBCATEGORY_ID
                              ? 'Leave blank for no sub-label on tasks'
                              : undefined
                          }
                          className="min-h-[40px] min-w-[6rem] flex-1 rounded border border-muted-border px-2 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => onDeleteSub(s.id)}
                          className="text-xs text-muted-fg underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deletePrompt !== null}
        title={deleteDialogCopy?.title ?? ''}
        message={deleteDialogCopy?.message ?? ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeletePrompt(null)}
      />
    </div>
  );
}
