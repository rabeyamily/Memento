import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_CATEGORY_ID,
  DEFAULT_SUBCATEGORY_ID,
  STORAGE_KEYS,
} from '../utils/constants';
import { toISODate } from '../utils/dates';
import { taskOccursOnDate } from '../utils/recurrence';
import { sanitizePlainText, sanitizeRichHtml } from '../utils/sanitize';
import { anchorDateForWeekday } from '../utils/tracker';

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const defaultSettings = {
  dotColor: '#e5e5e5',
  bgColor: '#fafafa',
  textColor: '#111111',
  textMuted: '#737373',
  accentDark: '#111111',
  borderMuted: '#e5e5e5',
};

function normalizeSettings(raw) {
  if (!raw || typeof raw !== 'object') return { ...defaultSettings };
  return {
    dotColor: raw.dotColor ?? defaultSettings.dotColor,
    bgColor: raw.bgColor ?? defaultSettings.bgColor,
    textColor: raw.textColor ?? defaultSettings.textColor,
    textMuted: raw.textMuted ?? defaultSettings.textMuted,
    accentDark: raw.accentDark ?? defaultSettings.accentDark,
    borderMuted: raw.borderMuted ?? defaultSettings.borderMuted,
  };
}

const defaultCategories = [{ id: DEFAULT_CATEGORY_ID, name: '' }];
const defaultSubcategories = [{ id: DEFAULT_SUBCATEGORY_ID, name: '' }];

/** Subcategories are global; tasks pair any category + any sub. Fix invalid ids only. */
function repairTaskCategorySubRefs(tasks, categories, subcategories) {
  if (!Array.isArray(tasks) || tasks.length === 0) return tasks;
  const catIds = new Set(categories.map((c) => c.id));
  const subIds = new Set(subcategories.map((s) => s.id));
  const fallbackSub =
    subcategories.find((s) => s.id === DEFAULT_SUBCATEGORY_ID)?.id ??
    subcategories[0]?.id ??
    DEFAULT_SUBCATEGORY_ID;

  let changed = false;
  const next = tasks.map((t) => {
    let categoryId = t.categoryId;
    let subcategoryId = t.subcategoryId;
    if (!catIds.has(categoryId)) {
      changed = true;
      categoryId = DEFAULT_CATEGORY_ID;
    }
    if (!subIds.has(subcategoryId)) {
      changed = true;
      subcategoryId = fallbackSub;
    }
    return { ...t, categoryId, subcategoryId };
  });

  if (changed) saveJSON(STORAGE_KEYS.tasks, next);
  return next;
}

function normalizeSubcategoriesFlat(subs) {
  return subs.map((s) => ({ id: s.id, name: s.name ?? '' }));
}

function migrateIfNeeded() {
  const hasCategoriesKey = localStorage.getItem(STORAGE_KEYS.categories);
  let categories = loadJSON(STORAGE_KEYS.categories, null);
  let subcategories = loadJSON(STORAGE_KEYS.subcategories, null);
  let tasks = loadJSON(STORAGE_KEYS.tasks, []);

  if (!hasCategoriesKey) {
    const oldSubs = loadJSON('memento_subcategories', []);
    categories = [...defaultCategories];
    if (Array.isArray(oldSubs) && oldSubs.length) {
      subcategories = normalizeSubcategoriesFlat(
        oldSubs.map((s) => ({
          id: s.id,
          name: s.name,
        }))
      );
      if (!subcategories.some((s) => s.id === DEFAULT_SUBCATEGORY_ID)) {
        subcategories = [...subcategories, ...defaultSubcategories];
      }
    } else {
      subcategories = [...defaultSubcategories];
    }
    saveJSON(STORAGE_KEYS.categories, categories);
    saveJSON(STORAGE_KEYS.subcategories, subcategories);
  }

  if (!categories?.length) {
    categories = [...defaultCategories];
    saveJSON(STORAGE_KEYS.categories, categories);
  }
  if (!subcategories?.length) {
    subcategories = [...defaultSubcategories];
    saveJSON(STORAGE_KEYS.subcategories, subcategories);
  }

  let renamedDefaults = false;
  categories = categories.map((c) => {
    if (c.id === DEFAULT_CATEGORY_ID && c.name === 'General') {
      renamedDefaults = true;
      return { ...c, name: '' };
    }
    return c;
  });
  subcategories = subcategories.map((s) => {
    if (s.id === DEFAULT_SUBCATEGORY_ID && s.name === 'General') {
      renamedDefaults = true;
      return { ...s, name: '' };
    }
    return s;
  });
  if (renamedDefaults) {
    saveJSON(STORAGE_KEYS.categories, categories);
    saveJSON(STORAGE_KEYS.subcategories, subcategories);
  }

  const subsWereNested = subcategories.some((s) => Object.prototype.hasOwnProperty.call(s, 'categoryId'));
  subcategories = normalizeSubcategoriesFlat(subcategories);
  if (subsWereNested) {
    saveJSON(STORAGE_KEYS.subcategories, subcategories);
  }

  if (tasks.length && tasks[0].days && !tasks[0].recurrence) {
    tasks = tasks.map((t) => ({
      id: t.id,
      contentHTML: t.contentHTML,
      categoryId: DEFAULT_CATEGORY_ID,
      subcategoryId: t.subcategoryId || DEFAULT_SUBCATEGORY_ID,
      recurrence: {
        type: 'days_of_week',
        days: Array.isArray(t.days) ? t.days : ['mon'],
        startDate: toISODate(new Date()),
        endDate: null,
      },
      time: t.time ?? null,
      order:
        typeof t.order === 'object' && !Array.isArray(t.order)
          ? migrateOrderKeys(t.order)
          : {},
    }));
    saveJSON(STORAGE_KEYS.tasks, tasks);
  }

  if (tasks.length && tasks.some((t) => t.time === undefined)) {
    tasks = tasks.map((t) => ({ ...t, time: t.time ?? null }));
    saveJSON(STORAGE_KEYS.tasks, tasks);
  }

  tasks = repairTaskCategorySubRefs(tasks, categories, subcategories);

  let settings = loadJSON(STORAGE_KEYS.settings, null);
  settings = normalizeSettings(settings);
  saveJSON(STORAGE_KEYS.settings, settings);

  return {
    categories,
    subcategories,
    tasks,
    completions: loadJSON(STORAGE_KEYS.completions, {}),
    settings,
  };
}

/** Old order used weekday keys; drop — new model uses ISO dates only. */
function migrateOrderKeys(order) {
  if (!order || typeof order !== 'object') return {};
  const first = Object.keys(order)[0];
  if (first && /^\d{4}-\d{2}-\d{2}$/.test(first)) return order;
  return {};
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const initial = useMemo(() => migrateIfNeeded(), []);
  const [categories, setCategories] = useState(() => initial.categories);
  const [subcategories, setSubcategories] = useState(() => initial.subcategories);
  const [tasks, setTasks] = useState(() => initial.tasks);
  const [completions, setCompletions] = useState(() => initial.completions);
  const [settings, setSettings] = useState(() => normalizeSettings(initial.settings));

  const persistCategories = useCallback((next) => {
    setCategories(next);
    saveJSON(STORAGE_KEYS.categories, next);
  }, []);

  const persistSubcategories = useCallback((next) => {
    setSubcategories(next);
    saveJSON(STORAGE_KEYS.subcategories, next);
  }, []);

  const persistTasks = useCallback((next) => {
    setTasks(next);
    saveJSON(STORAGE_KEYS.tasks, next);
  }, []);

  const persistCompletions = useCallback((next) => {
    setCompletions(next);
    saveJSON(STORAGE_KEYS.completions, next);
  }, []);

  const persistSettings = useCallback((patch) => {
    setSettings((prev) => {
      const merged = normalizeSettings({ ...prev, ...patch });
      saveJSON(STORAGE_KEYS.settings, merged);
      return merged;
    });
  }, []);

  const newId = (prefix) =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const addCategory = useCallback(
    (name) => {
      const trimmed = sanitizePlainText(name).trim();
      if (!trimmed) return null;
      const row = { id: newId('cat'), name: trimmed };
      persistCategories([...categories, row]);
      return row;
    },
    [categories, persistCategories]
  );

  const renameCategory = useCallback(
    (id, name) => {
      const trimmed = sanitizePlainText(name).trim();
      if (!trimmed) return;
      persistCategories(
        categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
    },
    [categories, persistCategories]
  );

  const deleteCategory = useCallback(
    (id) => {
      if (id === DEFAULT_CATEGORY_ID) return;
      const fallback = DEFAULT_CATEGORY_ID;
      persistCategories(categories.filter((c) => c.id !== id));
      persistTasks(
        tasks.map((t) =>
          t.categoryId === id ? { ...t, categoryId: fallback } : t
        )
      );
    },
    [categories, tasks, persistCategories, persistTasks]
  );

  const addSubcategory = useCallback(
    (name) => {
      const trimmed = sanitizePlainText(name).trim();
      if (!trimmed) return null;
      const row = { id: newId('sc'), name: trimmed };
      persistSubcategories([...subcategories, row]);
      return row;
    },
    [subcategories, persistSubcategories]
  );

  const renameSubcategory = useCallback(
    (id, name) => {
      const trimmed = sanitizePlainText(name).trim();
      if (!trimmed) return;
      persistSubcategories(
        subcategories.map((s) => (s.id === id ? { ...s, name: trimmed } : s))
      );
    },
    [subcategories, persistSubcategories]
  );

  const deleteSubcategory = useCallback(
    (id) => {
      if (id === DEFAULT_SUBCATEGORY_ID) return;
      const others = subcategories.filter((s) => s.id !== id);
      if (others.length === 0) return;
      const fallback =
        others.find((s) => s.id === DEFAULT_SUBCATEGORY_ID)?.id ?? others[0].id;
      persistSubcategories(others);
      persistTasks(
        tasks.map((t) =>
          t.subcategoryId === id ? { ...t, subcategoryId: fallback } : t
        )
      );
    },
    [subcategories, tasks, persistSubcategories, persistTasks]
  );

  const addTask = useCallback(
    (payload) => {
      const clean = sanitizeRichHtml(payload.contentHTML);
      const row = {
        id: newId('task'),
        contentHTML: clean,
        categoryId: payload.categoryId,
        subcategoryId: payload.subcategoryId,
        time: payload.time ?? null,
        recurrence: payload.recurrence,
        order: {},
      };
      persistTasks([...tasks, row]);
    },
    [tasks, persistTasks]
  );

  const updateTask = useCallback(
    (id, patch) => {
      persistTasks(
        tasks.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch };
          if (patch.contentHTML !== undefined) {
            next.contentHTML = sanitizeRichHtml(patch.contentHTML);
          }
          if (patch.recurrence) {
            next.recurrence = patch.recurrence;
          }
          if (patch.time !== undefined) {
            next.time = patch.time;
          }
          return next;
        })
      );
    },
    [tasks, persistTasks]
  );

  const deleteTask = useCallback(
    (id) => {
      persistTasks(tasks.filter((t) => t.id !== id));
      const nextCompletions = { ...completions };
      Object.keys(nextCompletions).forEach((date) => {
        if (nextCompletions[date]?.[id] !== undefined) {
          const copy = { ...nextCompletions[date] };
          delete copy[id];
          nextCompletions[date] = copy;
        }
      });
      persistCompletions(nextCompletions);
    },
    [tasks, completions, persistTasks, persistCompletions]
  );

  const reorderTasksInGroup = useCallback(
    (categoryId, subcategoryId, dayKey, orderedIds) => {
      const anchor = anchorDateForWeekday(dayKey, new Date());
      const iso = toISODate(anchor);
      persistTasks(
        tasks.map((t) => {
          const idx = orderedIds.indexOf(t.id);
          if (idx === -1) return t;
          if (t.categoryId !== categoryId || t.subcategoryId !== subcategoryId)
            return t;
          if (!taskOccursOnDate(t.recurrence, anchor)) return t;
          return {
            ...t,
            order: { ...t.order, [iso]: idx },
          };
        })
      );
    },
    [tasks, persistTasks]
  );

  const toggleCompletion = useCallback(
    (taskId, date = new Date()) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !taskOccursOnDate(task.recurrence, date)) return;
      const key = toISODate(date);
      const prevDay = { ...(completions[key] || {}) };
      const nextVal = !prevDay[taskId];
      if (nextVal) prevDay[taskId] = true;
      else delete prevDay[taskId];
      persistCompletions({ ...completions, [key]: prevDay });
    },
    [tasks, completions, persistCompletions]
  );

  const updateSettings = useCallback(
    (patch) => {
      persistSettings({ ...settings, ...patch });
    },
    [settings, persistSettings]
  );

  const value = useMemo(
    () => ({
      categories,
      subcategories,
      tasks,
      completions,
      settings,
      addCategory,
      renameCategory,
      deleteCategory,
      addSubcategory,
      renameSubcategory,
      deleteSubcategory,
      addTask,
      updateTask,
      deleteTask,
      reorderTasksInGroup,
      toggleCompletion,
      updateSettings,
    }),
    [
      categories,
      subcategories,
      tasks,
      completions,
      settings,
      addCategory,
      renameCategory,
      deleteCategory,
      addSubcategory,
      renameSubcategory,
      deleteSubcategory,
      addTask,
      updateTask,
      deleteTask,
      reorderTasksInGroup,
      toggleCompletion,
      updateSettings,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
