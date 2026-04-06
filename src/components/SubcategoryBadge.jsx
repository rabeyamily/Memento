export function SubcategoryBadge({ name }) {
  return (
    <span className="inline-flex max-w-[10rem] truncate rounded border border-muted-border bg-paper/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink">
      {name}
    </span>
  );
}
