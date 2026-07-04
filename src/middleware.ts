// =============================================================================
// Middleware de autenticação
// -----------------------------------------------------------------------------
// Roda no Edge Runtime a cada requisição das rotas do `matcher`. Usa apenas a
// configuração base (auth.config.ts) — sem provedores Node — para ler o cookie
// de sessão e aplicar o callback `authorized` (proteção/redirecionamento).
// =============================================================================

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Aplica o middleware a tudo, exceto assets estáticos, imagens do Next,
  // favicon e as rotas de API de autenticação (que precisam passar livres).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
