import { create } from "zustand";
import type {
  AgentMode,
  AgentStep,
  ChatMessage,
  LLMId,
  CostSnapshot,
  FallbackInfo,
  ProviderUsage,
} from "@/lib/types";
import { parseCodeBlocks } from "@/lib/parse-code-blocks";
import { emitFilesChanged } from "@/lib/builder-events";
import { toast } from "@/store/toast-store";

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
  // Projeto ativo no builder: alvo dos arquivos gerados pela IA.
  projectId: string | null;
  // Histórico de mensagens por projeto (evita que o chat de um projeto
  // vaze para outro ou seja perdido ao trocar de contexto dentro da SPA).
  messagesByProject: Record<string, ChatMessage[]>;
  setProjectId: (projectId: string | null) => void;
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
  projectId: null,
  messagesByProject: {},

  setProjectId: (projectId) =>
    set((s) => {
      if (s.projectId === projectId) return s;
      const updates: Partial<ChatState> = { projectId };
      // Salva a conversa do projeto anterior.
      if (s.projectId) {
        updates.messagesByProject = { ...s.messagesByProject, [s.projectId]: s.messages };
      }
      // Carrega a conversa do novo projeto (ou começa do welcome).
      if (projectId) {
        updates.messages = s.messagesByProject[projectId] ?? [WELCOME];
      } else {
        updates.messages = [WELCOME];
      }
      return updates;
    }),
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

      // 5. Persiste os arquivos gerados (blocos com path=) no projeto ativo e
      // recarrega o preview. Cada arquivo vira um "passo" exibido na bolha.
      await persistGeneratedFiles(get().projectId, full, assistantId, set);
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

// Assinatura mínima do `set` do zustand usada pelo helper abaixo.
type ChatSet = (fn: (state: ChatState) => Partial<ChatState>) => void;

// Faz o parse dos blocos de código da resposta e grava cada arquivo no projeto
// via API. Anota o resultado (sucesso/erro por arquivo) como "passos" na bolha
// do assistente, computa diffs dos arquivos alterados e dispara o evento que
// recarrega o preview.
async function persistGeneratedFiles(
  projectId: string | null,
  fullText: string,
  assistantId: string,
  set: ChatSet,
): Promise<void> {
  if (!projectId) return;

  const files = parseCodeBlocks(fullText);
  if (files.length === 0) return;

  // Captura o estado atual dos arquivos para gerar os diffs.
  const existing = await fetchCurrentFiles(projectId);

  const steps: AgentStep[] = [];
  const diffs: import("@/lib/types").FileDiff[] = [];

  for (const file of files) {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.path, content: file.content }),
      });
      steps.push({
        id: `${assistantId}-${file.path}`,
        label: res.ok ? `Arquivo salvo: ${file.path}` : `Falha ao salvar: ${file.path}`,
        state: res.ok ? "done" : "error",
      });
      if (res.ok) {
        diffs.push({
          path: file.path,
          before: existing.get(file.path) ?? "",
          after: file.content,
        });
      }
    } catch {
      steps.push({
        id: `${assistantId}-${file.path}`,
        label: `Falha ao salvar: ${file.path}`,
        state: "error",
      });
    }
  }

  set((s) => ({
    messages: s.messages.map((m) =>
      m.id === assistantId ? { ...m, steps, diffs: diffs.length > 0 ? diffs : undefined } : m,
    ),
  }));

  emitFilesChanged(projectId);

  // Feedback consolidado via toast.
  const failed = steps.filter((s) => s.state === "error").length;
  const ok = steps.length - failed;
  if (ok > 0) toast.success(`${ok} arquivo(s) gerado(s) pela IA.`);
  if (failed > 0) toast.error(`${failed} arquivo(s) falharam ao salvar.`);
}

async function fetchCurrentFiles(projectId: string): Promise<Map<string, string>> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files`, { cache: "no-store" });
    if (!res.ok) return new Map();
    const data = (await res.json()) as { files: { path: string; content: string }[] };
    return new Map(data.files.map((f) => [f.path, f.content]));
  } catch {
    return new Map();
  }
}
