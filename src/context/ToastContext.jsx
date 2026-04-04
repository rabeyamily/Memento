import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const showToast = useCallback((message = 'Task added!') => {
    setLeaving(false);
    setToast(message);
    window.setTimeout(() => setLeaving(true), 1800);
    window.setTimeout(() => {
      setToast(null);
      setLeaving(false);
    }, 2200);
  }, []);

  const value = useMemo(() => ({ showToast, toast, leaving }), [showToast, toast, leaving]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="pointer-events-none fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 px-4"
          role="status"
          aria-live="polite"
        >
          <div
            className={`font-sans rounded-full border border-[#111] bg-[#111] px-4 py-2.5 text-sm text-white ${
              leaving ? 'animate-[toast-out_0.35s_ease-in_forwards]' : 'toast-enter'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>✓</span>
              {toast}
            </span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
