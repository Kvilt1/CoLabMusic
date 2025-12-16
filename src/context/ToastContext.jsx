import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const DEFAULT_MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 4500;
const DEFAULT_ERROR_DURATION_MS = 7000;
const DEFAULT_DEDUPE_WINDOW_MS = 1500;

function makeId() {
  try {
    // eslint-disable-next-line no-undef
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  const iconFor = (type) => {
    if (type === 'success') return CheckCircle2;
    if (type === 'error') return XCircle;
    return Info;
  };

  const stylesFor = (type) => {
    if (type === 'success') {
      return {
        wrap: 'border-emerald-500/25 bg-[#181818]',
        icon: 'text-emerald-400',
        bar: 'bg-emerald-500',
      };
    }
    if (type === 'error') {
      return {
        wrap: 'border-red-500/25 bg-[#181818]',
        icon: 'text-red-400',
        bar: 'bg-red-500',
      };
    }
    return {
      wrap: 'border-sky-500/25 bg-[#181818]',
      icon: 'text-sky-400',
      bar: 'bg-sky-500',
    };
  };

  return (
    <div className="fixed top-4 right-4 z-[200] w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
      <div className="flex flex-col gap-3">
        {toasts.map((t) => {
          const Icon = iconFor(t.type);
          const styles = stylesFor(t.type);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto overflow-hidden rounded-2xl border ${styles.wrap} shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
            >
              <div className="flex gap-3 p-4 items-start">
                <div className={`mt-0.5 ${styles.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title ? (
                    <div className="text-sm font-bold text-white">{t.title}</div>
                  ) : null}
                  <div className="text-sm text-gray-200 break-words">{t.message}</div>
                </div>
                <button
                  onClick={() => onDismiss(t.id)}
                  className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className={`h-1 ${styles.bar} opacity-70`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());
  const dedupeRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) clearTimeout(timeout);
    timeoutsRef.current.delete(id);
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
    for (const timeout of timeoutsRef.current.values()) clearTimeout(timeout);
    timeoutsRef.current.clear();
  }, []);

  const show = useCallback(
    (type, message, opts = {}) => {
      const now = Date.now();
      const dedupeKey = `${type}:${message}`;
      const dedupeWindowMs = opts.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
      const last = dedupeRef.current.get(dedupeKey);
      if (last && now - last < dedupeWindowMs) return null;
      dedupeRef.current.set(dedupeKey, now);

      const id = opts.id ?? makeId();
      const maxVisible = opts.maxVisible ?? DEFAULT_MAX_VISIBLE;
      const duration =
        opts.duration ??
        (type === 'error' ? DEFAULT_ERROR_DURATION_MS : DEFAULT_DURATION_MS);

      const toast = {
        id,
        type,
        title: opts.title ?? null,
        message,
        createdAt: now,
      };

      setToasts((prev) => {
        const next = [toast, ...prev];
        return next.slice(0, maxVisible);
      });

      if (duration && duration > 0) {
        const timeout = setTimeout(() => dismiss(id), duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      show,
      success: (message, opts) => show('success', message, opts),
      info: (message, opts) => show('info', message, opts),
      error: (message, opts) => show('error', message, opts),
      dismiss,
      clear,
    }),
    [show, dismiss, clear]
  );

  // Best-effort global async error toasts (ErrorBoundary handles render errors).
  useEffect(() => {
    const onError = (event) => {
      // eslint-disable-next-line no-console
      console.error(event?.error || event?.message || event);
      api.error('Something went wrong.');
    };
    const onUnhandledRejection = (event) => {
      // eslint-disable-next-line no-console
      console.error(event?.reason || event);
      api.error('Something went wrong.');
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}


