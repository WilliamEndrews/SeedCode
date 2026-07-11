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

// Protocolo de geração de arquivos: instruções que fazem o modelo emitir cada
// arquivo em um bloco de código cujo info-string carrega o caminho (path=...).
// O cliente faz o parse desses blocos e grava os arquivos no projeto.
const FILE_PROTOCOL = `
PROTOCOLO DE ARQUIVOS (obrigatório ao criar ou alterar código):
- Escreva CADA arquivo em um bloco de código cercado cujo info-string começa com o caminho, no formato:
  \`\`\`html path=index.html
  <conteúdo COMPLETO do arquivo>
  \`\`\`
- Sempre inclua o conteúdo COMPLETO do arquivo (nunca use "..." ou omita trechos).
- Para apps estáticos, gere ao menos "index.html". Use "styles.css" e "script.js" quando fizer sentido.
- No index.html, referencie os assets com <link rel="stylesheet" href="styles.css"> e <script src="script.js"></script>.
- Escreva um texto curto explicando o que criou ANTES ou DEPOIS dos blocos; a explicação nunca deve ir dentro dos blocos de arquivo.`;

// Instrução de sistema conforme o modo de trabalho selecionado no builder.
function systemPromptFor(mode: string | undefined): string {
  const base =
    "Você é o Agente SeedCode, um assistente de engenharia de software que ajuda a construir aplicações web (HTML, CSS, JS e, quando pedido, React/Next.js/Tailwind). Responda em português do Brasil, de forma objetiva e técnica.";

  switch (mode) {
    case "plan":
      return `${base} No modo PLAN, não escreva código final: proponha um plano claro em passos numerados, discutindo decisões e trade-offs.`;
    case "visual":
      return `${base} No modo VISUAL, foque em ajustes de UI/estilo. Ao alterar arquivos, siga o protocolo abaixo.\n${FILE_PROTOCOL}`;
    case "auto":
      return `${base} No modo AUTO, seja proativo: além de atender o pedido, sugira melhorias relevantes. Ao escrever código, siga o protocolo abaixo.\n${FILE_PROTOCOL}`;
    default:
      return `${base} No modo AGENT, execute a solicitação escrevendo o código necessário com explicações curtas, seguindo o protocolo abaixo.\n${FILE_PROTOCOL}`;
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
      "Access-Control-Expose-Headers": "X-LLM-Model, X-LLM-Fallback-From, X-LLM-Fallback-Reason",
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
