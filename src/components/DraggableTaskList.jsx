import { useCallback, useRef, useState } from 'react';

/** `lineBefore` is the gap index 0..length (before row i, or length = after last). */
function reorderWithLineBefore(ids, dragId, lineBefore) {
  const from = ids.indexOf(dragId);
  if (from === -1) return ids;
  const next = [...ids];
  const [item] = next.splice(from, 1);
  let t = lineBefore;
  if (lineBefore > from) t -= 1;
  t = Math.max(0, Math.min(t, next.length));
  next.splice(t, 0, item);
  return next;
}

export function DraggableTaskList({
  dayKey,
  orderedTasks,
  onReorder,
  renderRow,
  compact = false,
}) {
  void dayKey;
  /* renderRow(task, { index, prevTask }) */
  const ids = orderedTasks.map((t) => t.id);
  const containerRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [insertIndex, setInsertIndex] = useState(null);
  const touchRef = useRef({
    activeId: null,
    insertBefore: null,
    pointerId: null,
  });
  const listenersRef = useRef(null);

  const resolveInsertBefore = useCallback((clientY) => {
    const root = containerRef.current;
    if (!root) return 0;
    const rows = [...root.querySelectorAll('[data-task-row]')];
    if (rows.length === 0) return 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (clientY < mid) return i;
    }
    return rows.length;
  }, []);

  const applyReorder = useCallback(
    (dragId, lineBefore) => {
      if (!dragId || lineBefore === null || lineBefore === undefined) return;
      const next = reorderWithLineBefore(ids, dragId, lineBefore);
      if (next.join() !== ids.join()) onReorder(next);
    },
    [ids, onReorder]
  );

  const clearDrag = useCallback(() => {
    setDraggingId(null);
    setInsertIndex(null);
    touchRef.current = {
      activeId: null,
      insertBefore: null,
      pointerId: null,
    };
    if (listenersRef.current) {
      const { move, end } = listenersRef.current;
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
      listenersRef.current = null;
    }
  }, []);

  const onDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
    setInsertIndex(null);
  };

  const onDragEnd = () => {
    clearDrag();
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setInsertIndex(resolveInsertBefore(e.clientY));
  };

  const onDrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const idx = resolveInsertBefore(e.clientY);
    applyReorder(id, idx);
    clearDrag();
  };

  const onTouchStart = (e, id) => {
    if (listenersRef.current) {
      const { move, end } = listenersRef.current;
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
      listenersRef.current = null;
    }

    const t = e.touches[0];
    const insertBefore = resolveInsertBefore(t.clientY);
    const st = {
      activeId: id,
      insertBefore,
      pointerId: t.identifier,
    };
    touchRef.current = st;
    setDraggingId(id);
    setInsertIndex(insertBefore);

    const move = (ev) => {
      const tt = [...ev.touches].find((x) => x.identifier === st.pointerId);
      if (!tt) return;
      ev.preventDefault();
      const idx = resolveInsertBefore(tt.clientY);
      st.insertBefore = idx;
      setInsertIndex(idx);
    };

    const end = () => {
      applyReorder(st.activeId, st.insertBefore ?? 0);
      clearDrag();
    };

    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    listenersRef.current = { move, end };
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget)) {
          setInsertIndex(null);
        }
      }}
    >
      {orderedTasks.map((task, index) => (
        <div key={task.id} className="relative">
          {insertIndex === index && (
            <div
              className="pointer-events-none absolute -top-px left-0 right-0 z-10 h-0.5 bg-accent"
              aria-hidden
            />
          )}
          <div
            data-task-row
            data-id={task.id}
            className={`border-b border-muted-border transition-opacity duration-200 ease-out ${
              compact ? 'min-h-0 py-2' : 'min-h-[52px] py-3'
            } ${draggingId === task.id ? 'opacity-40' : 'opacity-100'}`}
          >
            {renderRow(task, {
              index,
              prevTask: index > 0 ? orderedTasks[index - 1] : null,
              dragHandle: (
                <span
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(e) => onDragStart(e, task.id)}
                  onDragEnd={onDragEnd}
                  onTouchStart={(e) => onTouchStart(e, task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                  }}
                  className="flex h-5 w-5 shrink-0 cursor-grab touch-none items-center justify-center select-none text-[10px] leading-none text-muted-fg active:cursor-grabbing"
                  aria-label="Drag to reorder"
                  style={{ touchAction: 'none' }}
                >
                  ⠿
                </span>
              ),
            })}
          </div>
        </div>
      ))}
      {insertIndex === orderedTasks.length && orderedTasks.length > 0 && (
        <div className="h-0.5 w-full shrink-0 bg-accent" aria-hidden />
      )}
    </div>
  );
}
