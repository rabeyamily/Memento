export function CategoryBadge({ name }) {
  return (
    <span className="inline-flex max-w-[12rem] truncate rounded-full border border-muted-border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-fg">
      {name}
    </span>
  );
}
