import { create } from "zustand";

interface UIState {
  activePanel: "code" | "visual";
  setActivePanel: (panel: "code" | "visual") => void;
  costPanelOpen: boolean;
  toggleCostPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: "code",
  setActivePanel: (panel) => set({ activePanel: panel }),
  costPanelOpen: true,
  toggleCostPanel: () => set((s) => ({ costPanelOpen: !s.costPanelOpen })),
}));
