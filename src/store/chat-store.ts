import { create } from "zustand";
import type { AgentMode, ChatMessage, LLMId, CostSnapshot, PlanStep, AgentStep } from "@/lib/types";

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

const WELCOME: ChatMessage = {
  id: "msg-welcome",
  role: "assistant",
  mode: "agent",
  createdAt: new Date().toISOString(),
  content:
    "Bem-vindo ao SeedCode! Descreva o app que você quer construir e eu cuido do resto — planejo, escrevo o código e mostro o preview ao vivo. Você mantém controle total.",
};

interface ChatState {
  mode: AgentMode;
  llm: LLMId;
  messages: ChatMessage[];
  isThinking: boolean;
  cost: CostSnapshot;
  setMode: (mode: AgentMode) => void;
  setLLM: (llm: LLMId) => void;
  sendMessage: (content: string) => void;
  approvePlanStep: (messageId: string, stepId: string) => void;
}

function buildAssistantReply(mode: AgentMode, prompt: string): ChatMessage {
  const base = {
    id: nextId(),
    role: "assistant" as const,
    mode,
    createdAt: new Date().toISOString(),
  };

  if (mode === "plan") {
    const plan: PlanStep[] = [
      { id: "p1", title: "Modelar dados", detail: `Definir schema para "${prompt.slice(0, 40)}".`, approved: false },
      { id: "p2", title: "Gerar UI", detail: "Criar páginas e componentes com Tailwind + shadcn/ui.", approved: false },
      { id: "p3", title: "Conectar backend", detail: "APIs, auth e persistência.", approved: false },
      { id: "p4", title: "Deploy", detail: "Build, preview e publicação.", approved: false },
    ];
    return { ...base, content: "Aqui está o plano proposto. Aprove os passos para eu executar:", plan };
  }

  if (mode === "agent" || mode === "auto") {
    const steps: AgentStep[] = [
      { id: "s1", label: "Analisando requisitos", state: "done" },
      { id: "s2", label: "Gerando estrutura de arquivos", state: "done" },
      { id: "s3", label: "Escrevendo componentes", state: "running" },
      { id: "s4", label: "Rodando build & lint", state: "pending" },
    ];
    const extra = mode === "auto" ? " Também sugeri 2 melhorias proativas no painel." : "";
    return { ...base, content: `Executando sua solicitação de forma autônoma.${extra}`, steps };
  }

  return {
    ...base,
    content: "Modo Visual ativo. Selecione qualquer elemento no preview para editar estilos e conteúdo — as mudanças viram diffs commitáveis.",
  };
}

export const useChatStore = create<ChatState>((set) => ({
  mode: "agent",
  llm: "claude-3.5-sonnet",
  messages: [WELCOME],
  isThinking: false,
  cost: { tokensUsed: 12840, costUsd: 0.04, requests: 3 },
  setMode: (mode) => set({ mode }),
  setLLM: (llm) => set({ llm }),
  sendMessage: (content) => {
    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      mode: useChatStore.getState().mode,
      content,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isThinking: true }));

    setTimeout(() => {
      set((s) => {
        const reply = buildAssistantReply(s.mode, content);
        const addedTokens = 800 + Math.floor(Math.random() * 1500);
        return {
          messages: [...s.messages, reply],
          isThinking: false,
          cost: {
            tokensUsed: s.cost.tokensUsed + addedTokens,
            costUsd: +(s.cost.costUsd + addedTokens * 0.000004).toFixed(4),
            requests: s.cost.requests + 1,
          },
        };
      });
    }, 900);
  },
  approvePlanStep: (messageId, stepId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.plan
          ? { ...m, plan: m.plan.map((p) => (p.id === stepId ? { ...p, approved: true } : p)) }
          : m
      ),
    })),
}));
