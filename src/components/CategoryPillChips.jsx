import { useMemo, useState } from 'react';
import { DEFAULT_SUBCATEGORY_ID } from '../utils/constants';
import {
  categoryChipLabel,
  shouldHideDefaultSubPicker,
  subcategoryChipLabel,
} from '../utils/categoryDisplay';
import { sanitizePlainText } from '../utils/sanitize';

function ChipDelete({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={`flex h-full min-w-[1.75rem] items-center justify-center border-l border-muted-border/80 text-muted-fg transition-colors hover:bg-black/5 hover:text-red-600 ${
        disabled ? 'cursor-not-allowed opacity-30' : ''
      }`}
      aria-label={label}
    >
      <span className="text-sm leading-none" aria-hidden>
        ×
      </span>
    </button>
  );
}

export function CategoryPillChips({
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  categories,
  subcategories,
  onAddCategory,
  onAddSubcategory,
  onEnsureSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
  defaultCategoryId,
}) {
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [catInput, setCatInput] = useState('');
  const [subInput, setSubInput] = useState('');

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const subsForCat = useMemo(
    () =>
      [...subcategories]
        .filter((s) => s.categoryId === categoryId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subcategories, categoryId]
  );

  const saveCat = () => {
    const t = sanitizePlainText(catInput).trim();
    if (!t) return;
    const row = onAddCategory(t);
    if (row) onCategoryChange(row.id);
    setCatInput('');
    setNewCatOpen(false);
  };

  const saveSub = () => {
    const t = sanitizePlainText(subInput).trim();
    if (!t || !categoryId) return;
    const row = onAddSubcategory(categoryId, t);
    if (row) onSubcategoryChange(row.id);
    setSubInput('');
    setNewSubOpen(false);
  };

  const chipOuterOn = 'border-accent bg-accent text-[#111]';
  const chipOuterOff = 'border-muted-border bg-paper text-ink';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
        {sortedCats.map((c) => {
          const selected = categoryId === c.id;
          const canDelete = c.id !== defaultCategoryId && onDeleteCategory;
          return (
            <span
              key={c.id}
              className={`inline-flex max-w-full overflow-hidden rounded-full border text-[11px] font-medium leading-none transition-colors ${
                selected ? chipOuterOn : chipOuterOff
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onCategoryChange(c.id);
                  const catSubs = [...subcategories]
                    .filter((s) => s.categoryId === c.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                  if (catSubs[0]) {
                    onSubcategoryChange(catSubs[0].id);
                    return;
                  }
                  if (onEnsureSubcategory) {
                    const row = onEnsureSubcategory(c.id);
                    if (row) onSubcategoryChange(row.id);
                  }
                }}
                className="min-h-[32px] shrink px-2.5 py-1.5 text-left"
              >
                {categoryChipLabel(c, defaultCategoryId)}
              </button>
              {canDelete && (
                <ChipDelete
                  label={`Delete category ${categoryChipLabel(c, defaultCategoryId)}`}
                  onClick={() => onDeleteCategory(c.id)}
                />
              )}
            </span>
          );
        })}
        {!newCatOpen ? (
          <button
            type="button"
            onClick={() => setNewCatOpen(true)}
            className={`inline-flex min-h-[32px] items-center rounded-full border border-dashed border-muted-border bg-paper px-2.5 py-1.5 text-[11px] font-medium leading-none text-muted-fg`}
          >
            + New
          </button>
        ) : (
          <div className="flex min-w-[9rem] max-w-full shrink-0 items-center gap-1 rounded-full border border-muted-border bg-paper px-2 py-0.5">
            <input
              autoFocus
              value={catInput}
              onChange={(e) => setCatInput(sanitizePlainText(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveCat();
                if (e.key === 'Escape') {
                  setNewCatOpen(false);
                  setCatInput('');
                }
              }}
              placeholder="Name"
              className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[11px] outline-none"
            />
            <button
              type="button"
              onClick={saveCat}
              className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-[#111]"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {categoryId && (
        <div className="space-y-2">
          {shouldHideDefaultSubPicker(categoryId, subsForCat, defaultCategoryId) ? (
            <p className="text-[11px] text-muted-fg">
              Subcategory is optional.{' '}
              <button
                type="button"
                onClick={() => setNewSubOpen(true)}
                className="font-medium text-ink underline decoration-muted-border underline-offset-2"
              >
                Add subgroup
              </button>{' '}
              if you want one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-1.5 gap-y-2">
              {subsForCat.length === 0 ? (
                <p className="text-[11px] text-muted-fg">Add a subcategory with + New.</p>
              ) : (
                subsForCat.map((s) => {
                  const selected = subcategoryId === s.id;
                  const canDeleteMoreThanOne = subsForCat.length > 1 && onDeleteSubcategory;
                  return (
                    <span
                      key={s.id}
                      className={`inline-flex max-w-full overflow-hidden rounded-full border text-[11px] font-medium leading-none transition-colors ${
                        selected ? chipOuterOn : chipOuterOff
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSubcategoryChange(s.id)}
                        className="min-h-[32px] shrink px-2.5 py-1.5 text-left"
                      >
                        {subcategoryChipLabel(s, DEFAULT_SUBCATEGORY_ID)}
                      </button>
                      {canDeleteMoreThanOne && (
                        <ChipDelete
                          label={`Delete subcategory ${subcategoryChipLabel(s, DEFAULT_SUBCATEGORY_ID)}`}
                          onClick={() => onDeleteSubcategory(s.id)}
                        />
                      )}
                    </span>
                  );
                })
              )}
              {!newSubOpen ? (
                <button
                  type="button"
                  onClick={() => setNewSubOpen(true)}
                  className="inline-flex min-h-[32px] items-center rounded-full border border-dashed border-muted-border bg-paper px-2.5 py-1.5 text-[11px] font-medium leading-none text-muted-fg"
                >
                  + New
                </button>
              ) : (
                <div className="flex min-w-[9rem] max-w-full shrink-0 items-center gap-1 rounded-full border border-muted-border bg-paper px-2 py-0.5">
                  <input
                    autoFocus
                    value={subInput}
                    onChange={(e) => setSubInput(sanitizePlainText(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveSub();
                      if (e.key === 'Escape') {
                        setNewSubOpen(false);
                        setSubInput('');
                      }
                    }}
                    placeholder="Name"
                    className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={saveSub}
                    className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-[#111]"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
          {shouldHideDefaultSubPicker(categoryId, subsForCat, defaultCategoryId) && newSubOpen && (
            <div className="flex min-w-[9rem] max-w-full shrink-0 items-center gap-1 rounded-full border border-muted-border bg-paper px-2 py-0.5">
              <input
                autoFocus
                value={subInput}
                onChange={(e) => setSubInput(sanitizePlainText(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveSub();
                  if (e.key === 'Escape') {
                    setNewSubOpen(false);
                    setSubInput('');
                  }
                }}
                placeholder="Name"
                className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[11px] outline-none"
              />
              <button
                type="button"
                onClick={saveSub}
                className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-[#111]"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
