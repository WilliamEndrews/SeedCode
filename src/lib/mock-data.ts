import type { Project, Template, LLMOption } from "./types";

// Lineup gratuito da fase atual: Groq Cloud + Google AI Studio.
// O custo é 0 no free tier; mantemos o campo para exibição/futuro.
export const LLM_OPTIONS: LLMOption[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "Groq",
    providerId: "groq",
    costPer1kTokens: 0,
    badge: "Melhor p/ código",
    free: true,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    provider: "Groq",
    providerId: "groq",
    costPer1kTokens: 0,
    badge: "Ultrarrápido",
    free: true,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    providerId: "google",
    costPer1kTokens: 0,
    badge: "Contexto 1M",
    free: true,
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-taskflow",
    name: "TaskFlow",
    description: "App de gestão de tarefas com quadros Kanban e colaboração em tempo real.",
    status: "live",
    framework: "Next.js + Supabase",
    updatedAt: "2026-07-01T14:20:00Z",
    thumbnailGradient: "from-emerald-500 to-teal-600",
    llm: "llama-3.3-70b-versatile",
  },
  {
    id: "proj-shopnest",
    name: "ShopNest",
    description: "E-commerce completo com carrinho, checkout Stripe e painel admin.",
    status: "building",
    framework: "Next.js + Prisma",
    updatedAt: "2026-07-02T09:05:00Z",
    thumbnailGradient: "from-violet-500 to-fuchsia-600",
    llm: "gemini-2.0-flash",
  },
  {
    id: "proj-pulse",
    name: "Pulse Analytics",
    description: "Dashboard de métricas com gráficos em tempo real e alertas.",
    status: "draft",
    framework: "Next.js + Postgres",
    updatedAt: "2026-06-28T18:40:00Z",
    thumbnailGradient: "from-sky-500 to-indigo-600",
    llm: "llama-3.1-8b-instant",
  },
  {
    id: "proj-inbox",
    name: "InboxAI",
    description: "Agente de IA que triagem e responde e-mails automaticamente.",
    status: "error",
    framework: "Next.js + LangGraph",
    updatedAt: "2026-06-30T11:15:00Z",
    thumbnailGradient: "from-amber-500 to-orange-600",
    llm: "gemini-2.0-flash",
  },
];

export const MOCK_TEMPLATES: Template[] = [
  { id: "tpl-saas", name: "SaaS Starter", description: "Auth, billing e dashboard prontos.", category: "SaaS", icon: "Rocket", gradient: "from-emerald-500 to-teal-600" },
  { id: "tpl-ecommerce", name: "E-commerce", description: "Loja com carrinho e checkout.", category: "Commerce", icon: "ShoppingBag", gradient: "from-violet-500 to-fuchsia-600" },
  { id: "tpl-agent", name: "AI Agent", description: "Agente com ferramentas e memória.", category: "AI", icon: "Bot", gradient: "from-sky-500 to-indigo-600" },
  { id: "tpl-dashboard", name: "Analytics", description: "Dashboard com gráficos e KPIs.", category: "Data", icon: "BarChart3", gradient: "from-rose-500 to-pink-600" },
  { id: "tpl-blog", name: "Blog / CMS", description: "Blog com MDX e painel de conteúdo.", category: "Content", icon: "PenLine", gradient: "from-amber-500 to-orange-600" },
  { id: "tpl-landing", name: "Landing Page", description: "Página de conversão de alta fidelidade.", category: "Marketing", icon: "Sparkles", gradient: "from-cyan-500 to-blue-600" },
];

export function getProjectById(id: string): Project | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}
