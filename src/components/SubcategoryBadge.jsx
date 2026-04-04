export function SubcategoryBadge({ name }) {
  return (
    <span className="inline-flex max-w-[10rem] truncate rounded border border-muted-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-fg">
      {name}
    </span>
  );
}
