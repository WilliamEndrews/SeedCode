// =============================================================================
// Rastreador de limites (rate-limit) por provedor — em memória
// -----------------------------------------------------------------------------
// Controla o consumo do free tier de cada provedor (Groq/Google) para:
//   1. Prever indisponibilidade e acionar fallback ANTES de chamar a API.
//   2. Registrar cooldown quando a API responde 429 (limite atingido).
//   3. Expor um snapshot para a UI mostrar tudo de forma transparente.
//
// Os limites abaixo são ESTIMATIVAS do free tier (variam por conta/modelo) e
// servem para as barras de consumo e para o fallback preventivo.
// Persistido em globalThis para sobreviver aos hot-reloads do Next.js.
// =============================================================================

import type { LLMProvider, ProviderUsage } from "@/lib/types";

// Configuração de limites estimados do free tier por provedor.
interface LimitConfig {
  label: string;
  rpm: number; // requisições por minuto
  daily: number; // requisições por dia
}

const LIMITS: Record<LLMProvider, LimitConfig> = {
  // Groq free tier: alto RPM, porém com teto diário por modelo.
  groq: { label: "Groq Cloud", rpm: 30, daily: 1000 },
  // Google AI Studio (Gemini 2.0 Flash) free tier.
  google: { label: "Google AI Studio", rpm: 15, daily: 1500 },
};

// Estado mutável de contagem por provedor.
interface ProviderState {
  minuteWindowStart: number; // epoch ms do início da janela de 1 min
  requestsThisMinute: number;
  dayStart: number; // epoch ms do início do dia corrente
  requestsToday: number;
  cooldownUntil: number | null; // epoch ms até quando está em cooldown
}

function freshState(now: number): ProviderState {
  return {
    minuteWindowStart: now,
    requestsThisMinute: 0,
    dayStart: now,
    requestsToday: 0,
    cooldownUntil: null,
  };
}

// Container global preservado entre hot-reloads.
const globalForRl = globalThis as unknown as {
  __seedcodeRateLimit?: Record<LLMProvider, ProviderState>;
};

const states: Record<LLMProvider, ProviderState> =
  globalForRl.__seedcodeRateLimit ?? {
    groq: freshState(Date.now()),
    google: freshState(Date.now()),
  };

globalForRl.__seedcodeRateLimit = states;

// Reinicia as janelas de minuto/dia se já expiraram.
function rollWindows(provider: LLMProvider, now: number): void {
  const s = states[provider];
  if (now - s.minuteWindowStart >= 60_000) {
    s.minuteWindowStart = now;
    s.requestsThisMinute = 0;
  }
  if (now - s.dayStart >= 86_400_000) {
    s.dayStart = now;
    s.requestsToday = 0;
  }
  // Limpa o cooldown expirado.
  if (s.cooldownUntil && now >= s.cooldownUntil) {
    s.cooldownUntil = null;
  }
}

// Indica se o provedor pode ser usado agora (sem cooldown e dentro dos limites).
export function canUse(provider: LLMProvider): boolean {
  const now = Date.now();
  rollWindows(provider, now);
  const s = states[provider];
  const limit = LIMITS[provider];

  if (s.cooldownUntil && now < s.cooldownUntil) return false;
  if (s.requestsThisMinute >= limit.rpm) return false;
  if (s.requestsToday >= limit.daily) return false;
  return true;
}

// Registra uma requisição bem-sucedida (incrementa contadores).
export function recordSuccess(provider: LLMProvider): void {
  const now = Date.now();
  rollWindows(provider, now);
  const s = states[provider];
  s.requestsThisMinute += 1;
  s.requestsToday += 1;
}

// Registra um 429 (limite atingido) e coloca o provedor em cooldown.
// `retryAfterMs` padrão de 60s quando o provedor não informa o tempo.
export function recordRateLimit(provider: LLMProvider, retryAfterMs = 60_000): void {
  const now = Date.now();
  rollWindows(provider, now);
  const s = states[provider];
  s.cooldownUntil = now + retryAfterMs;
  // Considera o minuto saturado para refletir na barra de consumo.
  s.requestsThisMinute = Math.max(s.requestsThisMinute, LIMITS[provider].rpm);
}

// Monta o snapshot de uso de todos os provedores para exibir na UI.
export function getUsageSnapshot(): ProviderUsage[] {
  const now = Date.now();
  return (Object.keys(LIMITS) as LLMProvider[]).map((provider) => {
    rollWindows(provider, now);
    const s = states[provider];
    const limit = LIMITS[provider];
    return {
      provider,
      label: limit.label,
      requestsThisMinute: s.requestsThisMinute,
      requestsToday: s.requestsToday,
      rpmLimit: limit.rpm,
      dailyLimit: limit.daily,
      cooldownUntil: s.cooldownUntil ? new Date(s.cooldownUntil).toISOString() : null,
      available: canUse(provider),
    };
  });
}
