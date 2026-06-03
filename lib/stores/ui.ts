// Stub: real implementation in Phase 6 task 6.1
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GlobalTheme = string;

type UiState = {
  globalTheme: GlobalTheme;
  soundOpen: boolean;
  compactMode: boolean;
  setTheme: (t: GlobalTheme) => void;
  setSound: (b: boolean) => void;
  setCompact: (b: boolean) => void;
  hydrate: (s: Pick<UiState, "globalTheme" | "soundOpen" | "compactMode">) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      globalTheme: "cafe",
      soundOpen: true,
      compactMode: false,
      setTheme: (t) => set({ globalTheme: t }),
      setSound: (b) => set({ soundOpen: b }),
      setCompact: (b) => set({ compactMode: b }),
      hydrate: (s) => set(s),
    }),
    { name: "rewards-ui" }
  )
);
