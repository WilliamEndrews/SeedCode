// Domain types for the SeedCode prototype.
// These interfaces are the contract the real backend will implement later.

export type AgentMode = "agent" | "plan" | "visual" | "auto";

export type ProjectStatus = "draft" | "building" | "live" | "error";

// Usuário autenticado exposto ao cliente (nunca inclui passwordHash).
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  // Provedor de origem da conta ("credentials", "google" ou "github").
  provider: string;
  createdAt: string;
}

// Usuário com dados sensíveis do servidor; nunca é enviado ao cliente.
export interface ServerUser extends PublicUser {
  passwordHash: string;
}

// Alias para compatibilidade: `User` no client é sempre o usuário público.
export type User = PublicUser;

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

// Arquivo pertencente a um projeto (sistema de arquivos virtual).
export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  updatedAt: string;
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
  // Modelo que efetivamente gerou esta resposta (transparência na UI).
  respondedBy?: LLMId;
  // Preenchido quando houve troca automática de modelo (fallback).
  fallback?: FallbackInfo;
  // Marca uma resposta que terminou em erro (ex.: todos os modelos falharam).
  error?: boolean;
  // Diffs dos arquivos alterados/gerados pela IA nesta mensagem.
  diffs?: FileDiff[];
}

export interface FileDiff {
  path: string;
  before: string;
  after: string;
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

// Provedores de IA usados na fase gratuita (Groq Cloud + Google AI Studio).
export type LLMProvider = "groq" | "google";

// Ids internos = ids reais dos modelos nos provedores (mapeamento 1:1).
export type LLMId =
  | "llama-3.3-70b-versatile"
  | "llama-3.1-8b-instant"
  | "gemini-2.0-flash";

export interface LLMOption {
  id: LLMId;
  name: string;
  // Nome de exibição do provedor (ex.: "Groq", "Google").
  provider: string;
  // Id do provedor para roteamento e controle de limites.
  providerId: LLMProvider;
  // Custo por 1k tokens (0 no free tier — mantido para exibição/futuro).
  costPer1kTokens: number;
  badge?: string;
  // Indica se o modelo roda no tier gratuito.
  free?: boolean;
}

export interface CostSnapshot {
  tokensUsed: number;
  costUsd: number;
  requests: number;
}

// Situação de uso/limite de um provedor, exibida de forma transparente na UI.
export interface ProviderUsage {
  provider: LLMProvider;
  label: string;
  // Requisições feitas no minuto e no dia correntes.
  requestsThisMinute: number;
  requestsToday: number;
  // Limites estimados do free tier (para as barras de consumo).
  rpmLimit: number;
  dailyLimit: number;
  // Quando em cooldown por rate-limit (429), até quando ficará indisponível.
  cooldownUntil: string | null;
  // Disponibilidade calculada (respeitando limites e cooldown).
  available: boolean;
}

// Evento de fallback: registra quando o gateway trocou de modelo.
export interface FallbackInfo {
  // Modelo originalmente solicitado que falhou/estourou limite.
  from: LLMId;
  // Modelo que efetivamente respondeu.
  to: LLMId;
  // Motivo legível (ex.: "Limite de requisições atingido").
  reason: string;
}
