// =============================================================================
// Middleware de autenticação
// -----------------------------------------------------------------------------
// Roda no Edge Runtime a cada requisição das rotas do `matcher`. Usa apenas a
// configuração base (auth.config.ts) — sem provedores Node — para ler o cookie
// de sessão e aplicar o callback `authorized` (proteção/redirecionamento).
// =============================================================================

import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

// Instância do NextAuth usada apenas para a lógica de proteção de rotas (GET).
const { auth } = NextAuth(authConfig);

export default function middleware(request: NextRequest) {
  // As Server Actions do App Router chegam como POST com o header `Next-Action`.
  // O middleware do NextAuth, ao envolver essas requisições, altera
  // headers/cookies de sessão e invalida a assinatura da action
  // ("Invalid Server Actions request"). Por isso, deixamos qualquer requisição
  // que não seja GET passar direto — a proteção de páginas via GET é suficiente.
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  // Delega a requisições GET a lógica de autenticação/redirecionamento padrão.
  return (auth as unknown as (req: NextRequest) => Promise<Response> | Response)(
    request,
  );
}

export const config = {
  // Aplica o middleware a tudo, exceto assets estáticos, imagens do Next,
  // favicon e as rotas de API de autenticação (que precisam passar livres).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
