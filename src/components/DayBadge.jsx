import { DAY_LABELS } from '../utils/constants';
import { formatShortDayDate, nextOccurrenceOnOrAfter } from '../utils/dates';

export function DayBadge({ dayKey, from = new Date() }) {
  const when = nextOccurrenceOnOrAfter(dayKey, from);
  return (
    <span className="inline-flex items-center rounded-full border border-muted-border px-2.5 py-0.5 text-xs font-medium text-ink">
      <span className="text-muted-fg">{DAY_LABELS[dayKey]}</span>
      <span className="mx-1 text-muted-border">·</span>
      <span>{formatShortDayDate(when)}</span>
    </span>
  );
}
