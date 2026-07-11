// =============================================================================
// Toast store (notificações leves, sem dependências externas)
// -----------------------------------------------------------------------------
// Store zustand minimalista para enfileirar notificações efêmeras. A função
// utilitária `toast` pode ser chamada de qualquer lugar (inclusive fora de
// componentes React), e o <Toaster /> montado no layout renderiza a fila.
// =============================================================================

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  add: (message: string, variant: ToastVariant) => void;
  remove: (id: string) => void;
}

// Tempo (ms) até o toast sumir automaticamente.
const AUTO_DISMISS_MS = 4000;

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (message, variant) => {
    const id = `toast-${Date.now()}-${counter++}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    // Remove automaticamente após o tempo definido.
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, AUTO_DISMISS_MS);
    }
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Helpers imperativos para disparar toasts de qualquer lugar do app.
export const toast = {
  success: (message: string) => useToastStore.getState().add(message, "success"),
  error: (message: string) => useToastStore.getState().add(message, "error"),
  info: (message: string) => useToastStore.getState().add(message, "info"),
};
