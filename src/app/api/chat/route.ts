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
PROTOCOLO DE ARQUIVOS — REGRAS OBRIGATÓRIAS AO CRIAR OU ALTERAR CÓDIGO:

1. Cada arquivo deve ser emitido em UM bloco de código cercado (\`\`\`) cujo INFO-STRING comece com o caminho no formato path=NOME_DO_ARQUIVO.EXT.
   Correto: \`\`\`html path=index.html
   Errado: \`\`\`html (sem path, o parser não consegue salvar o arquivo)

2. SEMPRE forneça o conteúdo COMPLETO do arquivo. NUNCA use "...", "// resto omitido", "TODO" ou seções incompletas. O app precisa funcionar imediatamente.

3. Para apps estáticos, gere ao menos "index.html". Use "styles.css" e "script.js" quando fizer sentido e referencie-os corretamente:
   <link rel="stylesheet" href="styles.css">
   <script src="script.js"></script>

4. Para apps React/Next.js + Tailwind, gere a estrutura mínima funcional: package.json, next.config.mjs, tsconfig.json, tailwind.config.ts, postcss.config.mjs, src/app/layout.tsx, src/app/page.tsx, src/app/globals.css. Use imports consistentes e caminhos corretos.

5. Escolha nomes de arquivo descritivos. Para projetos maiores, organize em pastas (ex.: src/components/Header.tsx, src/lib/utils.ts).

6. Forneça uma breve explicação em português ANTES ou DEPOIS dos blocos. A explicação NUNCA deve estar dentro dos blocos de arquivo.

7. Exemplo de saída esperada:
   Vou criar uma landing page simples e moderna.

   \`\`\`html path=index.html
   <!DOCTYPE html>
   <html lang="pt-BR">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Landing Page</title>
     <link rel="stylesheet" href="styles.css">
   </head>
   <body>
     <h1>Olá, mundo!</h1>
     <script src="script.js"></script>
   </body>
   </html>
   \`\`\`

   \`\`\`css path=styles.css
   body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: #f8fafc; }
   h1 { color: #10b981; }
   \`\`\`

   \`\`\`javascript path=script.js
   console.log("App carregado");
   \`\`\`

8. Se o usuário pedir apenas uma alteração, reescreva APENAS os arquivos que mudaram, mantendo o resto intacto.`;

// Instrução de sistema conforme o modo de trabalho selecionado no builder.
function systemPromptFor(mode: string | undefined): string {
  const base = `Você é o Agente SeedCode, um engenheiro frontend sênior e product designer experiente. Sua missão é transformar qualquer ideia — mesmo vaga — em uma aplicação web funcional, bonita e bem estruturada.

PRINCÍPIOS DE ATENDIMENTO:
- Idioma: português do Brasil, claro e amigável.
- Público-alvo: o usuário pode não saber nada de programação. Não exija detalhes técnicos (frameworks, bibliotecas, etc.). Use linguagem simples e ofereça defaults sensatos.
- Quando o pedido for vago ou ambíguo, faça NO MÁXIMO 3 perguntas curtas e objetivas para entender o objetivo (público-alvo, estilo/cores desejadas, funcionalidade principal). Depois proponha um plano e só gere arquivos quando tiver informações suficientes.
- Quando já houver informações suficientes, gere o código imediatamente, sem enrolação.
- Sempre escolha uma paleta de cores, tipografia e layout modernos por padrão, a menos que o usuário especifique o contrário.
- Prefira apps estáticos (HTML/CSS/JS) para páginas simples. Use React/Next.js + Tailwind apenas quando o pedido for complexo, dinâmico ou o usuário explicitamente pedir.
- Nunca deixe o app incompleto: inclua index, estilos, scripts e, quando útil, ícones via CDN (Lucide ou FontAwesome) e imagens via serviços gratuitos (Unsplash source URLs).
- Valide mentalmente se os caminhos referenciados correspondem aos arquivos gerados.
- Nunca responda apenas com "ok" ou "entendido" sem executar uma ação ou fazer perguntas de esclarecimento.`;

  switch (mode) {
    case "plan":
      return `${base}\n\nMODO PLAN — NÃO ESCREVA CÓDIGO FINAL. Entenda a ideia, faça as perguntas necessárias e devolva um plano claro em passos numerados, com decisões, sugestões de tecnologia e estilo. Aguarde aprovação do usuário.`;
    case "visual":
      return `${base}\n\nMODO VISUAL — Foque em ajustes de UI/estilo do projeto existente. Leve em conta os arquivos atuais e gere APENAS os arquivos que precisam mudar, seguindo o protocolo abaixo.\n\n${FILE_PROTOCOL}`;
    case "auto":
      return `${base}\n\nMODO AUTO — Seja proativo e use defaults elegantes. Além do pedido, sugira melhorias visuais/funcionais e gere o código completo imediatamente, a menos que algo esteja realmente ambíguo. Siga o protocolo abaixo.\n\n${FILE_PROTOCOL}`;
    default:
      return `${base}\n\nMODO AGENT — Execute a solicitação. Se o pedido for claro e completo, gere os arquivos de imediato. Se for vago, faça no máximo 3 perguntas curtas, proponha um plano e aguarde resposta. Siga o protocolo abaixo.\n\n${FILE_PROTOCOL}`;
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
