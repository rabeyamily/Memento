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

function pickDefaultSubId(subs) {
  const byDefault = subs.find((s) => s.id === DEFAULT_SUBCATEGORY_ID);
  if (byDefault) return byDefault.id;
  const sorted = [...subs].sort((a, b) => a.name.localeCompare(b.name));
  return sorted[0]?.id ?? DEFAULT_SUBCATEGORY_ID;
}

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
  const [subcategoryId, setSubcategoryId] = useState(() =>
    pickDefaultSubId(subcategories)
  );
  const [recurrence, setRecurrence] = useState(defaultRec);
  const [editingId, setEditingId] = useState(null);
  const [taskTime, setTaskTime] = useState('');
  const [timeExpanded, setTimeExpanded] = useState(false);
  const [armedDeleteTaskId, setArmedDeleteTaskId] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [managerNewCatName, setManagerNewCatName] = useState('');
  const [managerNewSubName, setManagerNewSubName] = useState('');
  const lastEditQuery = useRef(null);

  const today = new Date();
  const todayDayKey = getDayKey(today);

  useEffect(() => {
    if (subcategories.some((s) => s.id === subcategoryId)) return;
    setSubcategoryId(pickDefaultSubId(subcategories));
  }, [subcategories, subcategoryId]);

  const catName = (id) => categories.find((c) => c.id === id)?.name ?? '';
  const subName = (id) => subcategories.find((s) => s.id === id)?.name ?? '';

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const sortedSubs = useMemo(() => {
    const list = [...subcategories].sort((a, b) => a.name.localeCompare(b.name));
    const def = list.find((s) => s.id === DEFAULT_SUBCATEGORY_ID);
    const rest = list.filter((s) => s.id !== DEFAULT_SUBCATEGORY_ID);
    return def ? [def, ...rest] : list;
  }, [subcategories]);

  const taskPairs = useMemo(() => {
    const byKey = new Map();
    for (const t of tasks) {
      const key = `${t.categoryId}\0${t.subcategoryId}`;
      if (!byKey.has(key)) {
        byKey.set(key, { categoryId: t.categoryId, subcategoryId: t.subcategoryId });
      }
    }
    const catLabel = (id) => (categories.find((c) => c.id === id)?.name || '').trim();
    const subLabel = (id) => (subcategories.find((s) => s.id === id)?.name || '').trim();
    return [...byKey.values()].sort((a, b) => {
      const c = catLabel(a.categoryId).localeCompare(catLabel(b.categoryId));
      if (c !== 0) return c;
      return subLabel(a.subcategoryId).localeCompare(subLabel(b.subcategoryId));
    });
  }, [tasks, categories, subcategories]);

  const resolveSubcategoryForSave = (currentSubId) => {
    if (subcategories.some((s) => s.id === currentSubId)) return currentSubId;
    return pickDefaultSubId(subcategories);
  };

  const resetForm = () => {
    setDraftHtml('');
    setInitialHtml('');
    setEditorKey((k) => k + 1);
    setRecurrence(defaultRec());
    setEditingId(null);
    setCategoryId(categories[0]?.id ?? DEFAULT_CATEGORY_ID);
    setSubcategoryId(pickDefaultSubId(subcategories));
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
    const subId = resolveSubcategoryForSave(subcategoryId);
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
            'Tasks in this category will move to the default category. Their subcategory labels stay as you set them.',
        }
      : deletePrompt?.type === 'sub'
        ? {
            title: 'Delete subcategory?',
            message:
              'Tasks that use this subcategory will use None (no subgroup) instead. The built-in None option cannot be removed.',
          }
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-12 pb-24">
      <div className="flex flex-col gap-3">
        <header className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="font-display text-[32px] leading-tight text-ink">Tasks</h1>
          <span className="rounded-full border border-muted-border bg-paper px-2.5 py-1 text-xs font-medium tabular-nums leading-none text-muted-fg">
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
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#999]">
            Category (optional)
          </p>
          <p className="mb-4 text-xs text-muted-fg">
            Categories and subcategories are separate lists—pick any pair for this task. Subcategory is optional: keep{' '}
            <span className="font-medium text-ink">None</span> if you do not want a subgroup. Use{' '}
            <span className="font-medium text-ink">+ New</span> or <span className="font-medium text-ink">Manage</span>{' '}
            to add labels.
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
        {taskPairs.map(({ categoryId: catId, subcategoryId: subId }) => {
          const cat = categories.find((c) => c.id === catId);
          const sub = subcategories.find((s) => s.id === subId);
          if (!cat || !sub) return null;
          const pool = tasks.filter(
            (t) => t.categoryId === catId && t.subcategoryId === subId
          );
          if (pool.length === 0) return null;
          const ordered = sortTasksForDate(pool, today);
          const catHeading = (cat.name || '').trim();
          const subHeading = (sub.name || '').trim();
          return (
            <div key={`${catId}-${subId}`}>
              {(catHeading || subHeading) && (
                <div className="mb-4">
                  {catHeading ? (
                    <h3 className="font-display text-lg text-ink">{catHeading}</h3>
                  ) : null}
                  {subHeading ? (
                    <p className="mt-1.5 text-base font-medium leading-snug text-ink">{subHeading}</p>
                  ) : null}
                </div>
              )}
              <div className="rounded-xl border border-muted-border bg-paper/80">
                <DraggableTaskList
                  dayKey={todayDayKey}
                  orderedTasks={ordered}
                  onReorder={(ids) =>
                    reorderTasksInGroup(catId, subId, todayDayKey, ids)
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
        {!managerOpen && (
          <p className="mt-2 text-sm text-muted-fg">
            Open <span className="font-medium text-ink">Manage</span> to rename or remove labels. Subcategories are
            not tied to a single category—you mix and match when you add a task.
          </p>
        )}
        {managerOpen && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-muted-border bg-paper/80 p-4">
              <div className="min-w-[12rem] flex-1">
                <label
                  htmlFor="manager-new-cat"
                  className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#999]"
                >
                  New category
                </label>
                <input
                  id="manager-new-cat"
                  value={managerNewCatName}
                  onChange={(e) => setManagerNewCatName(sanitizePlainText(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const t = managerNewCatName.trim();
                      if (!t) return;
                      const row = addCategory(t);
                      if (row) {
                        setManagerNewCatName('');
                        showToast('Category added');
                      }
                    }
                  }}
                  placeholder="e.g. Morning, Work"
                  className="min-h-[44px] w-full rounded-lg border border-muted-border px-3 py-2 text-sm text-ink"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const t = managerNewCatName.trim();
                  if (!t) return;
                  const row = addCategory(t);
                  if (row) {
                    setManagerNewCatName('');
                    showToast('Category added');
                  }
                }}
                className="min-h-[44px] rounded-full border border-muted-border bg-accent px-4 text-sm font-medium text-[#111]"
              >
                Add category
              </button>
            </div>
            <p className="text-xs text-muted-fg">
              Edit category names below; subcategories live in their own list and pair with a category only when you
              assign a task.
            </p>
            {sortedCats.map((cat) => (
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
              </div>
            ))}
            <div className="rounded-xl border border-muted-border bg-paper p-5">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-[#999]">
                Subcategories
              </p>
              <p className="mb-3 text-xs text-muted-fg">
                Tasks can use <span className="font-medium text-ink">None</span> so a subgroup is always optional. The
                first row is that built-in option (rename it only if you want a different default label).
              </p>
              <div className="mb-4 flex flex-wrap items-end gap-2 border-b border-muted-border pb-4">
                <input
                  aria-label="New subcategory name"
                  value={managerNewSubName}
                  onChange={(e) => setManagerNewSubName(sanitizePlainText(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const t = managerNewSubName.trim();
                      if (!t) return;
                      const row = addSubcategory(t);
                      if (row) {
                        setManagerNewSubName('');
                        showToast('Subcategory added');
                      }
                    }
                  }}
                  placeholder="New subcategory name"
                  className="min-h-[40px] min-w-[10rem] flex-1 rounded-lg border border-muted-border px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = managerNewSubName.trim();
                    if (!t) return;
                    const row = addSubcategory(t);
                    if (row) {
                      setManagerNewSubName('');
                      showToast('Subcategory added');
                    }
                  }}
                  className="min-h-[40px] rounded-full border border-muted-border px-3 text-sm font-medium text-ink"
                >
                  Add subcategory
                </button>
              </div>
              <ul className="space-y-2">
                {sortedSubs.map((s) => (
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
                    {s.id !== DEFAULT_SUBCATEGORY_ID ? (
                      <button
                        type="button"
                        onClick={() => onDeleteSub(s.id)}
                        className="text-xs text-muted-fg underline"
                      >
                        Remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
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
