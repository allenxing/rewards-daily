"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastQueue } from "@/lib/stores/toast-queue";
import type { ToastVariant } from "@/lib/stores/toast-queue";
import styles from "./toast.module.css";

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const AUTO_DISMISS_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const tc = useTranslations("common");
  const queue = useToastQueue((s) => s.queue);
  const push = useToastQueue((s) => s.push);
  const dismiss = useToastQueue((s) => s.dismiss);

  useEffect(() => {
    if (queue.length === 0) return;
    const oldest = queue[0];
    if (!oldest) return;
    const age = Date.now() - oldest.createdAt;
    const remaining = Math.max(0, AUTO_DISMISS_MS - age);
    const timer = setTimeout(() => dismiss(oldest.id), remaining);
    return () => clearTimeout(timer);
  }, [queue, dismiss]);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      push({ message, variant });
    },
    [push]
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container} role="region" aria-label={tc("toastRegion")}>
        {queue.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.variant]}`}
            role={t.variant === "error" ? "alert" : "status"}
          >
            <span className={styles.icon}>
              {t.variant === "success" ? (
                <CheckCircle2 size={18} />
              ) : t.variant === "error" ? (
                <AlertCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </span>
            <span className={styles.message}>{t.message}</span>
            <button
              type="button"
              className={styles.close}
              aria-label={tc("toastClose")}
              onClick={() => dismiss(t.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
