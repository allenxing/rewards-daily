// Stub: real implementation in Phase 6 task 6.2
"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";
export type ToastEntry = {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
};

type ToastState = {
  queue: ToastEntry[];
  push: (t: Omit<ToastEntry, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
};

export const useToastQueue = create<ToastState>()((set) => ({
  queue: [],
  push: (t) =>
    set((s) => ({
      queue: [
        ...s.queue,
        { id: crypto.randomUUID(), createdAt: Date.now(), ...t },
      ],
    })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((e) => e.id !== id) })),
}));
