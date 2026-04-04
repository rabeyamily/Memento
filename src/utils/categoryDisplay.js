import { DEFAULT_CATEGORY_ID, DEFAULT_SUBCATEGORY_ID } from './constants';

/** Label for the default category chip when its stored name is empty. */
export const UNCATEGORIZED_CHIP_LABEL = 'None';

export function categoryChipLabel(category, defaultCategoryId) {
  const n = (category?.name || '').trim();
  if (n) return n;
  if (category?.id === defaultCategoryId) return UNCATEGORIZED_CHIP_LABEL;
  return 'Untitled';
}

export function subcategoryChipLabel(subcategory, defaultSubcategoryId) {
  const n = (subcategory?.name || '').trim();
  if (n) return n;
  if (subcategory?.id === defaultSubcategoryId) return '—';
  return 'Untitled';
}

/**
 * Only the default unnamed sub exists under the default category — hide sub picker until user adds another.
 */
export function shouldHideDefaultSubPicker(categoryId, subsForCategory, defaultCategoryId) {
  return (
    categoryId === defaultCategoryId &&
    subsForCategory.length === 1 &&
    subsForCategory[0].id === DEFAULT_SUBCATEGORY_ID &&
    !(subsForCategory[0].name || '').trim()
  );
}
