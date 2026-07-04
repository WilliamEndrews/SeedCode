// =============================================================================
// Gateway multi-LLM com fallback automático
// -----------------------------------------------------------------------------
// Recebe a conversa e o modelo solicitado, e tenta gerar a resposta em stream.
// Se o modelo escolhido estiver em cooldown/limite ou falhar com 429, cai
// automaticamente para o próximo da cadeia de fallback. Reporta qual modelo
// respondeu e, se houve troca, o motivo — para total transparência na UI.
// =============================================================================

import { streamText, type CoreMessage } from "ai";
import type { FallbackInfo, LLMId } from "@/lib/types";
import { buildFallbackChain, MODEL_REGISTRY, providerOf } from "./models";
import { canUse, recordRateLimit, recordSuccess } from "./rate-limit";

interface StreamChatParams {
  messages: CoreMessage[];
  system?: string;
  requested: LLMId;
}

export interface StreamChatResult {
  // Stream pronto para virar o corpo da Response (bytes UTF-8).
  stream: ReadableStream<Uint8Array>;
  // Modelo que efetivamente respondeu.
  model: LLMId;
  // Preenchido apenas quando houve troca de modelo.
  fallback?: FallbackInfo;
}

// Erro lançado quando nenhum modelo da cadeia conseguiu responder.
export class AllModelsFailedError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "AllModelsFailedError";
  }
}

// Detecta se um erro é de rate-limit (429) ou de cota esgotada.
function isRateLimitError(error: unknown): boolean {
  const e = error as { statusCode?: number; status?: number; message?: string };
  if (e?.statusCode === 429 || e?.status === 429) return true;
  const msg = (e?.message ?? "").toLowerCase();
  return msg.includes("rate limit") || msg.includes("quota") || msg.includes("429");
}

// Motivo legível para exibir no aviso de fallback.
function reasonFor(error: unknown, unavailableByLimit: boolean): string {
  if (unavailableByLimit) return "Limite do free tier atingido (cooldown ativo)";
  if (isRateLimitError(error)) return "Limite de requisições atingido (429)";
  const msg = (error as { message?: string })?.message;
  return msg ? `Falha no provedor: ${msg.slice(0, 120)}` : "Falha no provedor";
}

// Tenta cada modelo da cadeia até um responder. Retorna o stream + metadados.
export async function streamChat({
  messages,
  system,
  requested,
}: StreamChatParams): Promise<StreamChatResult> {
  const chain = buildFallbackChain(requested);
  const encoder = new TextEncoder();

  // Guarda o motivo pelo qual o modelo solicitado não foi usado.
  let fallbackReason = "";

  for (const candidate of chain) {
    const provider = providerOf(candidate);

    // Fallback preventivo: pula provedores em cooldown/limite conhecido.
    if (!canUse(provider)) {
      if (!fallbackReason) fallbackReason = reasonFor(null, true);
      continue;
    }

    try {
      const result = streamText({
        model: MODEL_REGISTRY[candidate].build(),
        system,
        messages,
      });

      // Usa o fullStream: no AI SDK v4 os erros do provider (429, auth, etc.)
      // chegam como parte { type: "error" } — o textStream simplesmente encerra
      // vazio e engoliria a falha, impedindo o fallback. Aqui lemos até o
      // primeiro texto (sucesso) ou até uma parte de erro (dispara fallback).
      const reader = result.fullStream.getReader();
      let firstText: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value.type === "error") throw value.error;
        if (value.type === "text-delta") {
          firstText = value.textDelta;
          break;
        }
      }

      // Stream terminou sem texto e sem erro explícito → trata como falha
      // para permitir o fallback (evita "resposta vazia" silenciosa).
      if (firstText === null) {
        throw new Error("Resposta vazia do modelo");
      }

      // Chamada aceita: contabiliza uso e monta o stream de saída.
      recordSuccess(provider);

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          // Reenfileira o primeiro texto já lido.
          controller.enqueue(encoder.encode(firstText as string));
          // Bombeia o restante do stream, encaminhando apenas texto.
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value.type === "error") {
                controller.error(value.error);
                return;
              }
              if (value.type === "text-delta") {
                controller.enqueue(encoder.encode(value.textDelta));
              }
            }
          } catch (streamError) {
            controller.error(streamError);
            return;
          }
          controller.close();
        },
        cancel() {
          reader.cancel().catch(() => {});
        },
      });

      // Monta info de fallback se o modelo usado não foi o solicitado.
      const fallback: FallbackInfo | undefined =
        candidate !== requested
          ? { from: requested, to: candidate, reason: fallbackReason || "Modelo indisponível" }
          : undefined;

      return { stream, model: candidate, fallback };
    } catch (error) {
      // Falha ao iniciar: registra cooldown se for 429 e tenta o próximo.
      if (isRateLimitError(error)) {
        recordRateLimit(provider);
      }
      fallbackReason = reasonFor(error, false);
    }
  }

  // Nenhum modelo respondeu.
  throw new AllModelsFailedError(
    fallbackReason || "Nenhum modelo disponível no momento.",
  );
}
