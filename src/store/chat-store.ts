import { create } from "zustand";
import type {
  AgentMode,
  ChatMessage,
  LLMId,
  CostSnapshot,
  FallbackInfo,
  ProviderUsage,
} from "@/lib/types";

// Gerador de ids únicos e crescentes para as mensagens.
let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

// Mensagem inicial de boas-vindas do assistente.
const WELCOME: ChatMessage = {
  id: "msg-welcome",
  role: "assistant",
  mode: "agent",
  createdAt: new Date().toISOString(),
  content:
    "Bem-vindo ao SeedCode! Descreva o app que você quer construir e eu cuido do resto — planejo, escrevo o código e explico as decisões. Você mantém controle total.",
};

// Estimativa simples de tokens (~4 caracteres por token) para o painel de uso.
function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

interface ChatState {
  mode: AgentMode;
  llm: LLMId;
  messages: ChatMessage[];
  isThinking: boolean;
  cost: CostSnapshot;
  // Snapshot de uso/limites dos provedores (para o painel de transparência).
  providers: ProviderUsage[];
  setMode: (mode: AgentMode) => void;
  setLLM: (llm: LLMId) => void;
  sendMessage: (content: string) => Promise<void>;
  fetchProviderStatus: () => Promise<void>;
  approvePlanStep: (messageId: string, stepId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  mode: "agent",
  llm: "llama-3.3-70b-versatile",
  messages: [WELCOME],
  isThinking: false,
  cost: { tokensUsed: 0, costUsd: 0, requests: 0 },
  providers: [],

  setMode: (mode) => set({ mode }),
  setLLM: (llm) => set({ llm }),

  // Busca o status atual dos provedores no backend.
  fetchProviderStatus: async () => {
    try {
      const res = await fetch("/api/llm/status");
      if (!res.ok) return;
      const data = (await res.json()) as { providers: ProviderUsage[] };
      set({ providers: data.providers });
    } catch {
      // Silencioso: status é informativo e não deve quebrar a UI.
    }
  },

  // Envia a mensagem do usuário e faz o streaming da resposta do assistente.
  sendMessage: async (content) => {
    const state = get();

    // 1. Acrescenta a mensagem do usuário.
    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      mode: state.mode,
      content,
      createdAt: new Date().toISOString(),
    };

    // 2. Cria a mensagem do assistente (vazia) que será preenchida via stream.
    const assistantId = nextId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      mode: state.mode,
      content: "",
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      isThinking: true,
    }));

    // Monta o histórico enviado ao modelo (apenas role/content textuais).
    const history = [...state.messages, userMsg]
      .filter((m) => m.role !== "system" && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, model: state.llm, mode: state.mode }),
      });

      // Erro tratado (401/400/503): mostra a mensagem de erro na bolha.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Falha na resposta." }));
        set((s) => ({
          isThinking: false,
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? { ...m, content: data.error ?? "Erro ao gerar resposta.", error: true }
              : m,
          ),
        }));
        return;
      }

      // Lê os metadados de transparência dos headers.
      const respondedBy = (res.headers.get("X-LLM-Model") as LLMId) ?? state.llm;
      const fromHeader = res.headers.get("X-LLM-Fallback-From") as LLMId | null;
      const reasonHeader = res.headers.get("X-LLM-Fallback-Reason");
      const fallback: FallbackInfo | undefined = fromHeader
        ? {
            from: fromHeader,
            to: respondedBy,
            reason: reasonHeader ? decodeURIComponent(reasonHeader) : "Modelo indisponível",
          }
        : undefined;

      // Marca o modelo/fallback na bolha assim que a resposta começa.
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantId ? { ...m, respondedBy, fallback } : m,
        ),
      }));

      // 3. Consome o stream de texto, atualizando a bolha em tempo real.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, content: full } : m,
          ),
        }));
      }

      // 4. Atualiza custo/uso estimados e o status dos provedores.
      const tokens = estimateTokens(content) + estimateTokens(full);
      set((s) => ({
        isThinking: false,
        cost: {
          tokensUsed: s.cost.tokensUsed + tokens,
          costUsd: 0, // free tier
          requests: s.cost.requests + 1,
        },
      }));
      void get().fetchProviderStatus();
    } catch {
      // Falha de rede inesperada.
      set((s) => ({
        isThinking: false,
        messages: s.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Erro de conexão ao gerar resposta.", error: true }
            : m,
        ),
      }));
    }
  },

  approvePlanStep: (messageId, stepId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.plan
          ? { ...m, plan: m.plan.map((p) => (p.id === stepId ? { ...p, approved: true } : p)) }
          : m,
      ),
    })),
}));
