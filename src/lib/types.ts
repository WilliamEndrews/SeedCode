// Domain types for the SeedCode prototype.
// These interfaces are the contract the real backend will implement later.

export type AgentMode = "agent" | "plan" | "visual" | "auto";

export type ProjectStatus = "draft" | "building" | "live" | "error";

// Usuário autenticado. O campo `passwordHash` só existe no servidor
// (nunca é enviado ao cliente) e será migrado para o banco na Fase 2B.
export interface User {
  id: string;
  name: string;
  email: string;
  // Hash bcrypt da senha — presente apenas para contas criadas por credenciais.
  passwordHash?: string;
  // Provedor de origem da conta ("credentials", "google" ou "github").
  provider: string;
  createdAt: string;
}

// Dados aceitos ao criar um novo projeto via API (/api/projects).
export interface CreateProjectInput {
  name: string;
  description?: string;
  framework?: string;
  llm?: LLMId;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  framework: string;
  updatedAt: string;
  thumbnailGradient: string;
  llm: LLMId;
  // Id do usuário dono do projeto. Opcional para os projetos mock legados.
  ownerId?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  gradient: string;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  mode: AgentMode;
  createdAt: string;
  // Optional structured plan (Plan Mode) or steps (Agent Mode).
  plan?: PlanStep[];
  steps?: AgentStep[];
}

export interface PlanStep {
  id: string;
  title: string;
  detail: string;
  approved: boolean;
}

export type StepState = "pending" | "running" | "done" | "error";

export interface AgentStep {
  id: string;
  label: string;
  state: StepState;
}

export type LLMId = "gpt-4o" | "claude-3.5-sonnet" | "grok-2" | "gemini-1.5-pro";

export interface LLMOption {
  id: LLMId;
  name: string;
  provider: string;
  costPer1kTokens: number;
  badge?: string;
}

export interface CostSnapshot {
  tokensUsed: number;
  costUsd: number;
  requests: number;
}
