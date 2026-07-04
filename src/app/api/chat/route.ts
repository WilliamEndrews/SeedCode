// =============================================================================
// Route Handler — Chat com IA (/api/chat)
// -----------------------------------------------------------------------------
// POST: recebe a conversa + modelo escolhido, gera a resposta em STREAMING via
// gateway multi-LLM (com fallback automático) e devolve o texto em stream.
// Os metadados (modelo que respondeu e eventual fallback) vão em HEADERS, pois
// são conhecidos antes do corpo começar a ser enviado — isso mantém a UI 100%
// transparente sobre qual modelo respondeu e por quê.
// =============================================================================

import { z } from "zod";
import type { CoreMessage } from "ai";
import { auth } from "@/auth";
import { streamChat, AllModelsFailedError } from "@/server/llm/gateway";

// Validação do corpo da requisição.
const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .min(1),
  model: z.enum([
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemini-2.0-flash",
  ]),
  mode: z.enum(["agent", "plan", "visual", "auto"]).optional(),
});

// Instrução de sistema conforme o modo de trabalho selecionado no builder.
function systemPromptFor(mode: string | undefined): string {
  const base =
    "Você é o Agente SeedCode, um assistente de engenharia de software que ajuda a construir aplicações web (Next.js, React, TypeScript, Tailwind). Responda em português do Brasil, de forma objetiva e técnica.";

  switch (mode) {
    case "plan":
      return `${base} No modo PLAN, não escreva código final: proponha um plano claro em passos numerados, discutindo decisões e trade-offs.`;
    case "visual":
      return `${base} No modo VISUAL, foque em ajustes de UI/estilo (Tailwind), explicando as mudanças de forma sucinta.`;
    case "auto":
      return `${base} No modo AUTO, seja proativo: além de atender o pedido, sugira melhorias relevantes.`;
    default:
      return `${base} No modo AGENT, execute a solicitação escrevendo o código necessário com explicações curtas.`;
  }
}

export async function POST(request: Request) {
  // Exige sessão válida.
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Faz o parse e valida o corpo.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { messages, model, mode } = parsed.data;

  try {
    // Aciona o gateway (tenta o modelo e cai no fallback se necessário).
    const result = await streamChat({
      requested: model,
      system: systemPromptFor(mode),
      messages: messages as CoreMessage[],
    });

    // Metadados de transparência nos headers da resposta.
    const headers = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-LLM-Model": result.model,
    });
    if (result.fallback) {
      headers.set("X-LLM-Fallback-From", result.fallback.from);
      // Codifica o motivo para evitar caracteres inválidos em header.
      headers.set("X-LLM-Fallback-Reason", encodeURIComponent(result.fallback.reason));
    }

    return new Response(result.stream, { status: 200, headers });
  } catch (error) {
    // Todos os modelos falharam → 503 com motivo legível.
    const message =
      error instanceof AllModelsFailedError
        ? error.reason
        : "Falha ao gerar resposta.";
    return Response.json({ error: message }, { status: 503 });
  }
}
