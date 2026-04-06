import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizeRichHtml } from '../utils/sanitize';

const HIGHLIGHT_SWATCHES = [
  { hex: '#fef08a', label: 'Yellow' },
  { hex: '#bbf7d0', label: 'Mint' },
  { hex: '#fed7aa', label: 'Peach' },
  { hex: '#e9d5ff', label: 'Lavender' },
  { hex: '#bae6fd', label: 'Sky' },
  { hex: '#fecaca', label: 'Coral' },
];

const TEXT_COLORS = [
  { hex: '#111111', label: 'Black' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#16a34a', label: 'Green' },
  { hex: '#2563eb', label: 'Blue' },
  { hex: '#9333ea', label: 'Purple' },
];

const LAST_HI_KEY = 'memento_highlight_last';

function getLastHighlight() {
  try {
    const v = localStorage.getItem(LAST_HI_KEY);
    if (v && HIGHLIGHT_SWATCHES.some((s) => s.hex === v)) return v;
  } catch {
    /* ignore */
  }
  return HIGHLIGHT_SWATCHES[0].hex;
}

function setLastHighlight(hex) {
  try {
    localStorage.setItem(LAST_HI_KEY, hex);
  } catch {
    /* ignore */
  }
}

function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
}

function focusEditor(el) {
  if (!el) return;
  el.focus();
}

export function RichTextEditor({
  onChange,
  placeholder = "What's the task?",
  resetKey = 0,
  initialHtml = '',
  variant = 'default',
}) {
  const ref = useRef(null);
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });
  const [showHi, setShowHi] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [lastHi, setLastHi] = useState(() => getLastHighlight());

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    onChange(sanitizeRichHtml(el.innerHTML));
  }, [onChange]);

  const syncActive = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel?.anchorNode || !el.contains(sel.anchorNode)) return;
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = sanitizeRichHtml(initialHtml || '');
  }, [resetKey, initialHtml]);

  useEffect(() => {
    const el = ref.current;
    const handler = () => syncActive();
    document.addEventListener('selectionchange', handler);
    el.addEventListener('keyup', handler);
    el.addEventListener('mouseup', handler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      el.removeEventListener('keyup', handler);
      el.removeEventListener('mouseup', handler);
    };
  }, [syncActive]);

  const runFormat = (cmd) => {
    focusEditor(ref.current);
    exec(cmd);
    emit();
    requestAnimationFrame(syncActive);
  };

  const applyHighlightColor = (hex) => {
    const el = ref.current;
    focusEditor(el);
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch {
      /* ignore */
    }
    const worked = document.execCommand('hiliteColor', false, hex);
    if (!worked) {
      wrapSelectionBackground(el, hex);
    }
    setLastHighlight(hex);
    setLastHi(hex);
    setShowHi(false);
    emit();
    requestAnimationFrame(syncActive);
  };

  const applyForeColor = (hex) => {
    focusEditor(ref.current);
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch {
      /* ignore */
    }
    exec('foreColor', hex);
    setShowColors(false);
    emit();
    requestAnimationFrame(syncActive);
  };

  const onHighlightBtn = () => {
    setShowColors(false);
    setShowHi((s) => !s);
  };

  const toolBase =
    'flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg border text-sm font-semibold transition-colors';
  const toolBaseCard =
    'flex h-9 min-h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold transition-colors';
  const toolOff = `${toolBase} border-transparent bg-transparent text-ink`;
  const toolOn = `${toolBase} border-accent bg-accent/15 text-ink`;
  const toolOffCard = `${toolBaseCard} border-transparent bg-transparent text-ink`;
  const toolOnCard = `${toolBaseCard} border-accent bg-accent/15 text-ink`;

  const toolBaseFloat =
    'flex h-8 w-8 items-center justify-center rounded border text-sm font-semibold transition-colors';
  const toolOffFloat = `${toolBaseFloat} border-muted-border bg-paper text-ink`;
  const toolOnFloat = `${toolBaseFloat} border-accent bg-accent/15 text-ink`;

  const renderToolbar = (floating, compactCard = false) => {
    const off = floating ? toolOffFloat : compactCard ? toolOffCard : toolOff;
    const on = floating ? toolOnFloat : compactCard ? toolOnCard : toolOn;
    const hiBtnClass = floating ? toolOffFloat : compactCard ? toolOffCard : toolOff;
    const popSide = floating ? 'top-full mt-1' : 'bottom-full mb-1';
    const swatchClass = compactCard
      ? 'h-5 w-5 shrink-0 rounded-full border border-muted-border'
      : 'h-6 w-6 shrink-0 rounded-full border border-muted-border';
    const popRowClass = `absolute left-1/2 z-30 flex -translate-x-1/2 flex-row flex-nowrap items-center gap-1 rounded-lg border border-muted-border bg-paper p-1.5 shadow-sm [scrollbar-width:none] sm:gap-1.5 sm:p-2 [&::-webkit-scrollbar]:hidden ${popSide} max-w-[calc(100dvw-env(safe-area-inset-left)-env(safe-area-inset-right)-0.75rem)] overflow-x-auto`;

    const toolbarRowClass = floating
      ? 'relative z-10 flex flex-wrap items-center justify-evenly gap-1 rounded-lg border border-muted-border bg-paper px-2 py-2'
      : compactCard
        ? 'relative z-10 flex flex-wrap items-center justify-evenly gap-0.5 px-1 py-0'
        : 'relative z-10 flex flex-wrap items-center justify-evenly gap-1 px-2 py-1.5';

    return (
      <div className="relative w-full">
        <div
          className={toolbarRowClass}
          onMouseDown={(e) => e.preventDefault()}
          role="toolbar"
          aria-label="Text formatting"
        >
          <button
            type="button"
            className={active.bold ? on : off}
            onClick={() => runFormat('bold')}
            aria-label="Bold"
            aria-pressed={active.bold}
          >
            <span className="text-base font-bold">B</span>
          </button>
          <button
            type="button"
            className={`${active.italic ? on : off} italic`}
            onClick={() => runFormat('italic')}
            aria-label="Italic"
            aria-pressed={active.italic}
          >
            <span className="text-base font-bold">I</span>
          </button>
          <button
            type="button"
            className={active.underline ? on : off}
            onClick={() => runFormat('underline')}
            aria-label="Underline"
            aria-pressed={active.underline}
          >
            <span className="text-base font-bold">U</span>
          </button>
          <button
            type="button"
            className={active.strikeThrough ? on : off}
            onClick={() => runFormat('strikeThrough')}
            aria-label="Strikethrough"
            aria-pressed={active.strikeThrough}
          >
            <span className="text-base font-bold">S</span>
          </button>
          <button
            type="button"
            className={`${hiBtnClass} relative overflow-visible p-0`}
            onClick={onHighlightBtn}
            aria-label="Highlight"
            aria-expanded={showHi}
            title="Highlight"
          >
            <svg
              className="mx-auto block"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 20h16M6 16l8-12 4 4-8 12H6v-4z" />
            </svg>
            <span
              className="absolute bottom-0.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: lastHi }}
              aria-hidden
            />
          </button>
          <button
            type="button"
            className={off}
            onClick={() => {
              setShowHi(false);
              setShowColors((s) => !s);
            }}
            aria-label="Text color"
            aria-expanded={showColors}
          >
            <span
              className="h-3 w-3 rounded-full border border-muted-border"
              style={{ backgroundColor: 'var(--text-color, #111)' }}
            />
          </button>
        </div>
        {showHi && (
          <div className={popRowClass} role="listbox" aria-label="Highlight colors">
            {HIGHLIGHT_SWATCHES.map((s) => (
              <button
                key={s.hex}
                type="button"
                title={s.label}
                className={swatchClass}
                style={{ backgroundColor: s.hex }}
                onClick={() => applyHighlightColor(s.hex)}
              />
            ))}
          </div>
        )}
        {showColors && (
          <div className={popRowClass} role="listbox" aria-label="Text colors">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                className={swatchClass}
                style={{ backgroundColor: c.hex }}
                onClick={() => applyForeColor(c.hex)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const editorClass =
    variant === 'card'
      ? 'min-h-[88px] flex-1 px-5 pt-1 pb-2 text-base leading-relaxed text-ink outline-none'
      : 'min-h-[88px] rounded-lg border border-muted-border bg-paper px-3 py-3 text-base leading-relaxed text-ink outline-none';

  if (variant === 'card') {
    return (
      <div className="flex flex-col overflow-visible rounded-xl border border-muted-border bg-paper">
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className={editorClass}
          onInput={() => {
            emit();
            syncActive();
          }}
          onBlur={emit}
          onFocus={syncActive}
        />
        <div className="relative border-t border-muted-border px-0.5 py-1">
          {renderToolbar(false, true)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-11">
      <div className="absolute left-0 right-0 top-0 z-10">{renderToolbar(true)}</div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={editorClass}
        onInput={() => {
          emit();
          syncActive();
        }}
        onBlur={emit}
        onFocus={syncActive}
      />
    </div>
  );
}

function wrapSelectionBackground(editorEl, color) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !editorEl.contains(sel.anchorNode)) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  try {
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    const nr = document.createRange();
    nr.selectNodeContents(span);
    nr.collapse(false);
    sel.addRange(nr);
  } catch {
    /* ignore partial selections across blocks */
  }
}
