// =============================================================================
// Rate-limit simples por usuário para operações de arquivos
// -----------------------------------------------------------------------------
// Protege as rotas de escrita/deleção de arquivos contra spam/abuso. Contador
// em memória (globalThis) reseta a cada minuto. Em produção, substituir por
// Redis/Upstash para rate-limit distribuído.
// =============================================================================

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60; // 60 operações de arquivo por minuto

interface UserWindow {
  start: number;
  count: number;
}

const globalForRl = globalThis as unknown as {
  __seedcodeFileRateLimit?: Map<string, UserWindow>;
};

const windows = globalForRl.__seedcodeFileRateLimit ?? new Map<string, UserWindow>();
globalForRl.__seedcodeFileRateLimit = windows;

function now() {
  return Date.now();
}

export function checkFileRateLimit(userId: string): { allowed: boolean; retryAfter: number } {
  const current = now();
  let w = windows.get(userId);

  if (!w || current - w.start >= WINDOW_MS) {
    w = { start: current, count: 0 };
    windows.set(userId, w);
  }

  if (w.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((w.start + WINDOW_MS - current) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  w.count += 1;
  return { allowed: true, retryAfter: 0 };
}
