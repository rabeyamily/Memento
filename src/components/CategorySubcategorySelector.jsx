import { useMemo, useState } from 'react';
import { sanitizePlainText } from '../utils/sanitize';

export function CategorySubcategorySelector({
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  categories,
  subcategories,
  onAddCategory,
  onAddSubcategory,
}) {
  const [showCat, setShowCat] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [catInput, setCatInput] = useState('');
  const [subInput, setSubInput] = useState('');

  const sortedSubs = useMemo(
    () => [...subcategories].sort((a, b) => a.name.localeCompare(b.name)),
    [subcategories]
  );

  const saveCat = () => {
    const t = sanitizePlainText(catInput).trim();
    if (!t) return;
    const row = onAddCategory(t);
    if (row) onCategoryChange(row.id);
    setCatInput('');
    setShowCat(false);
  };

  const saveSub = () => {
    const t = sanitizePlainText(subInput).trim();
    if (!t) return;
    const row = onAddSubcategory(t);
    if (row) onSubcategoryChange(row.id);
    setSubInput('');
    setShowSub(false);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label
          htmlFor="field-cat"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-fg"
        >
          Category
        </label>
        <select
          id="field-cat"
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-lg border border-muted-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {!showCat ? (
          <button
            type="button"
            onClick={() => setShowCat(true)}
            className="mt-2 text-xs font-medium text-accent"
          >
            + New category
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={catInput}
              onChange={(e) => setCatInput(sanitizePlainText(e.target.value))}
              placeholder="Name"
              className="min-w-0 flex-1 rounded border border-muted-border px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={saveCat}
              className="rounded border border-ink bg-ink px-3 py-1.5 text-xs text-paper"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCat(false);
                setCatInput('');
              }}
              className="text-xs text-muted-fg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="field-sub"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-fg"
        >
          Subcategory
        </label>
        <select
          id="field-sub"
          value={subcategoryId}
          onChange={(e) => onSubcategoryChange(e.target.value)}
          disabled={sortedSubs.length === 0}
          className="w-full rounded-lg border border-muted-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
        >
          {sortedSubs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {!showSub ? (
          <button
            type="button"
            onClick={() => setShowSub(true)}
            className="mt-2 text-xs font-medium text-accent"
          >
            + New subcategory
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={subInput}
              onChange={(e) => setSubInput(sanitizePlainText(e.target.value))}
              placeholder="Name"
              className="min-w-0 flex-1 rounded border border-muted-border px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={saveSub}
              className="rounded border border-ink bg-ink px-3 py-1.5 text-xs text-paper"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSub(false);
                setSubInput('');
              }}
              className="text-xs text-muted-fg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
