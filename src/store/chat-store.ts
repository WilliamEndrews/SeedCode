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
import { validateGeneratedFiles } from "@/lib/validate-generated-files";
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
  // Controle de auto-correção de arquivos gerados (evita loops infinitos).
  fixAttempt: number;
  isAutoFixing: boolean;
  setProjectId: (projectId: string | null) => void;
  setMode: (mode: AgentMode) => void;
  setLLM: (llm: LLMId) => void;
  sendMessage: (content: string, options?: { role?: "user" | "system" }) => Promise<void>;
  requestFix: (issues: string[]) => Promise<void>;
  runAgentLoop: (intent: string) => Promise<void>;
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
  fixAttempt: 0,
  isAutoFixing: false,

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
  sendMessage: async (content, options = { role: "user" }) => {
    const state = get();

    // Reseta contador de correção a cada novo turno do usuário.
    if (!state.isAutoFixing && options.role === "user") {
      set({ fixAttempt: 0 });
    }

    // 1. Acrescenta a mensagem do usuário (ou nota do sistema para correção).
    const userMsg: ChatMessage = {
      id: nextId(),
      role: options.role ?? "user",
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
      const files = await persistGeneratedFiles(get().projectId, full, assistantId, set);

      // 6. Valida os arquivos gerados e, se necessário, pede uma correção
      // automática (apenas 1 tentativa por turno para evitar loop de tokens).
      if (files.length > 0) {
        const validation = validateGeneratedFiles(files);
        if (!validation.ok && !get().isAutoFixing && get().fixAttempt < 1) {
          set((s) => ({ fixAttempt: s.fixAttempt + 1 }));
          await get().requestFix(validation.issues);
        }
      }
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

  requestFix: async (issues) => {
    set({ isAutoFixing: true });
    const prompt =
      `A resposta anterior gerou arquivos com os seguintes problemas:\n` +
      issues.map((i) => `- ${i}`).join("\n") +
      `\n\nPor favor, corrija TODOS os problemas acima e reenvie os arquivos completos, seguindo o protocolo de arquivos do SeedCode. Não responda apenas com explicações: gere os arquivos corrigidos.`;
    await get().sendMessage(prompt, { role: "system" });
    set({ isAutoFixing: false });
  },

  // Modo AUTO real: primeiro planeja, depois executa.
  runAgentLoop: async (intent) => {
    const state = get();
    if (!state.projectId) return;

    set({ fixAttempt: 0 });

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      mode: "auto",
      content: intent,
      createdAt: new Date().toISOString(),
    };

    const planId = nextId();
    const planMsg: ChatMessage = {
      id: planId,
      role: "assistant",
      mode: "plan",
      content: "",
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, planMsg],
      isThinking: true,
    }));

    const history = [...state.messages, userMsg]
      .filter((m) => m.role !== "system" && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    let codeId: string | null = null;

    try {
      // ETAPA 1: Planejamento.
      const planResult = await streamCompletion(
        [
          ...history,
          {
            role: "user",
            content:
              `${intent}\n\n` +
              `Antes de gerar código, elabore um plano detalhado: liste os arquivos que serão criados, a função de cada um e as decisões de design/UX. ` +
              `Não escreva blocos de código nem o conteúdo final dos arquivos nesta resposta.`,
          },
        ],
        state.llm,
        "plan",
        set,
        get,
      );

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === planId
            ? { ...m, content: planResult.text, respondedBy: planResult.respondedBy, fallback: planResult.fallback }
            : m,
        ),
      }));

      // ETAPA 2: Execução.
      codeId = nextId();
      const codeMsg: ChatMessage = {
        id: codeId,
        role: "assistant",
        mode: "auto",
        content: "",
        createdAt: new Date().toISOString(),
      };

      set((s) => ({
        messages: [...s.messages, codeMsg],
      }));

      const codeResult = await streamCompletion(
        [
          ...history,
          { role: "assistant", content: planResult.text },
          {
            role: "user",
            content:
              `Agora execute o plano acima e gere TODOS os arquivos de uma vez, seguindo rigorosamente o protocolo de arquivos do SeedCode. ` +
              `Cada arquivo deve estar em um bloco de código com o caminho no info-string (ex.: \`\`\`html path=index.html). ` +
              `Forneça o conteúdo completo de cada arquivo.`,
          },
        ],
        state.llm,
        "auto",
        set,
        get,
      );

      set((s) => ({
        isThinking: false,
        messages: s.messages.map((m) =>
          m.id === codeId
            ? { ...m, content: codeResult.text, respondedBy: codeResult.respondedBy, fallback: codeResult.fallback }
            : m,
        ),
      }));

      // ETAPA 3: Persistência e validação.
      const files = await persistGeneratedFiles(get().projectId, codeResult.text, codeId, set);
      if (files.length > 0) {
        const validation = validateGeneratedFiles(files);
        if (!validation.ok && !get().isAutoFixing && get().fixAttempt < 1) {
          set((s) => ({ fixAttempt: s.fixAttempt + 1 }));
          await get().requestFix(validation.issues);
        }
      }
    } catch {
      set((s) => ({
        isThinking: false,
        messages: s.messages.map((m) =>
          m.id === planId || m.id === codeId
            ? { ...m, content: "Falha ao executar o agente. Tente novamente.", error: true }
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

// Chama a API de chat em streaming e retorna o texto completo, atualizando
// os metadados de custo e uso de provedores. Não manipula mensagens da UI.
async function streamCompletion(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  model: LLMId,
  mode: AgentMode,
  set: ChatSet,
  get: () => ChatState,
): Promise<{ text: string; respondedBy: LLMId; fallback?: FallbackInfo }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model, mode }),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({ error: "Falha na resposta." }));
    throw new Error(data.error ?? "Falha na resposta.");
  }

  const respondedBy = (res.headers.get("X-LLM-Model") as LLMId) ?? model;
  const fromHeader = res.headers.get("X-LLM-Fallback-From") as LLMId | null;
  const reasonHeader = res.headers.get("X-LLM-Fallback-Reason");
  const fallback: FallbackInfo | undefined = fromHeader
    ? {
        from: fromHeader,
        to: respondedBy,
        reason: reasonHeader ? decodeURIComponent(reasonHeader) : "Modelo indisponível",
      }
    : undefined;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
  }

  const tokens = estimateTokens(full);
  set((s) => ({
    cost: {
      tokensUsed: s.cost.tokensUsed + tokens,
      costUsd: 0,
      requests: s.cost.requests + 1,
    },
  }));
  void get().fetchProviderStatus();

  return { text: full, respondedBy, fallback };
}

// Faz o parse dos blocos de código da resposta e grava cada arquivo no projeto
// via API. Anota o resultado (sucesso/erro por arquivo) como "passos" na bolha
// do assistente, computa diffs dos arquivos alterados e dispara o evento que
// recarrega o preview.
async function persistGeneratedFiles(
  projectId: string | null,
  fullText: string,
  assistantId: string,
  set: ChatSet,
): Promise<import("@/lib/parse-code-blocks").ParsedFile[]> {
  if (!projectId) return [];

  const files = parseCodeBlocks(fullText);
  if (files.length === 0) return [];

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

  return files;
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
