// =============================================================================
// Registro de modelos LLM
// -----------------------------------------------------------------------------
// Mapeia cada LLMId interno para o provedor correspondente e uma função que
// instancia o modelo via Vercel AI SDK. As chaves de API são lidas do ambiente
// pelos próprios providers:
//   - Groq   → GROQ_API_KEY
//   - Google → GOOGLE_GENERATIVE_AI_API_KEY  (aceita as novas keys "AQ.")
// =============================================================================

import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import type { LLMId, LLMProvider } from "@/lib/types";

interface ModelEntry {
  provider: LLMProvider;
  // Instancia o modelo sob demanda (evita criar clientes sem necessidade).
  build: () => LanguageModel;
}

// Como os LLMId já são os ids reais dos modelos, o mapeamento é direto.
export const MODEL_REGISTRY: Record<LLMId, ModelEntry> = {
  "llama-3.3-70b-versatile": {
    provider: "groq",
    build: () => groq("llama-3.3-70b-versatile"),
  },
  "llama-3.1-8b-instant": {
    provider: "groq",
    build: () => groq("llama-3.1-8b-instant"),
  },
  "gemini-2.0-flash": {
    provider: "google",
    build: () => google("gemini-2.0-flash"),
  },
};

// Ordem de preferência global usada para montar a cadeia de fallback.
// O modelo solicitado pelo usuário sempre é tentado primeiro; os demais
// entram nesta ordem.
export const FALLBACK_ORDER: LLMId[] = [
  "llama-3.3-70b-versatile",
  "gemini-2.0-flash",
  "llama-3.1-8b-instant",
];

// Monta a cadeia de tentativas a partir do modelo solicitado:
// [solicitado, ...restantes na ordem de preferência].
export function buildFallbackChain(requested: LLMId): LLMId[] {
  return [requested, ...FALLBACK_ORDER.filter((id) => id !== requested)];
}

// Provedor de um modelo (atalho de consulta ao registro).
export function providerOf(id: LLMId): LLMProvider {
  return MODEL_REGISTRY[id].provider;
}
