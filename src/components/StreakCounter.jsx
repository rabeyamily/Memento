export function StreakCounter({ days }) {
  return (
    <p className="font-display text-2xl text-ink">
      <span aria-hidden="true">🔥</span>{' '}
      <span className="tabular-nums">{days}</span>
      <span className="text-lg font-sans font-normal text-muted-fg">
        {' '}
        day streak
      </span>
    </p>
  );
}
