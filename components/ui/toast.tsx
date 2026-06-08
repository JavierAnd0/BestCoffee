"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Check, X } from "lucide-react";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const Ctx = createContext<ToastContextValue | null>(null);

// Simple module-level dispatch so any client component can call toast()
// without consuming a hook in every file.
let dispatch: ((t: Omit<ToastItem, "id">) => void) | null = null;

export function toast(t: Omit<ToastItem, "id">) {
  dispatch?.(t);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((curr) => [...curr, { ...t, id }]);
    setTimeout(() => {
      setItems((curr) => curr.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    dispatch = push;
    return () => {
      dispatch = null;
    };
  }, [push]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed z-50 bottom-20 lg:bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm rounded-lg border border-border bg-background shadow-lg px-4 py-3 animate-in slide-in-from-bottom-2 fade-in"
        >
          <span className="size-7 rounded-full bg-emerald-500/10 text-emerald-700 grid place-items-center flex-shrink-0">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{t.title}</div>
            {t.description && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {t.description}
              </div>
            )}
            {t.action && (
              <button
                onClick={t.action.onClick}
                className="mt-2 text-xs font-medium underline-offset-2 hover:underline"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => setItems((c) => c.filter((x) => x.id !== t.id))}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  return v ?? { toast };
}
