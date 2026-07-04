// =============================================================================
// Route Handler — Status dos provedores de IA (/api/llm/status)
// -----------------------------------------------------------------------------
// GET: retorna o snapshot de uso/limites de cada provedor (Groq/Google) para a
// UI exibir barras de consumo, cooldowns e disponibilidade em tempo real.
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsageSnapshot } from "@/server/llm/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return NextResponse.json({ providers: getUsageSnapshot() });
}
