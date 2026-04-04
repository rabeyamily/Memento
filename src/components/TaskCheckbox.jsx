export function TaskCheckbox({ checked, onToggle, disabled, id }) {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onToggle()}
      className="group relative flex h-5 w-5 shrink-0 items-center justify-center rounded border border-muted-border bg-paper transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50"
      aria-pressed={checked}
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
    >
      <span
        className={`absolute inset-0 rounded transition-all duration-200 ease-out ${
          checked ? 'bg-accent scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      />
      <svg
        viewBox="0 0 24 24"
        className={`relative z-10 h-3 w-3 transition-all duration-200 ease-out ${
          checked ? 'scale-100 text-white opacity-100' : 'scale-75 text-transparent opacity-0'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}
