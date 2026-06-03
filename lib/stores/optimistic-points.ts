// Stub: real implementation in Phase 6 task 6.3 + Phase 4 task 4.4
"use client";

import { create } from "zustand";

type OptState = {
  overrides: Record<number, number>;
  applyOverride: (childId: number, delta: number) => void;
  reconcile: (childId: number, real: number) => void;
  clear: (childId: number) => void;
};

export const useOptimisticPoints = create<OptState>()((set) => ({
  overrides: {},
  applyOverride: (childId, delta) =>
    set((s) => {
      const current = s.overrides[childId] ?? 0;
      return { overrides: { ...s.overrides, [childId]: current + delta } };
    }),
  reconcile: (childId, _real) =>
    set((s) => {
      const next = { ...s.overrides };
      delete next[childId];
      return { overrides: next };
    }),
  clear: (childId) =>
    set((s) => {
      const next = { ...s.overrides };
      delete next[childId];
      return { overrides: next };
    }),
}));
