// =============================================================================
// Configuração base do NextAuth (compatível com o Edge Runtime)
// -----------------------------------------------------------------------------
// Este arquivo NÃO pode importar código Node-only (ex.: bcrypt, o store em
// memória), pois é consumido pelo `middleware.ts`, que roda no Edge Runtime.
// Aqui ficam apenas: páginas customizadas, estratégia de sessão e a lógica de
// proteção de rotas. Os provedores e callbacks que dependem do servidor ficam
// em `auth.ts`.
// =============================================================================

import type { NextAuthConfig } from "next-auth";

// Rotas que exigem usuário autenticado.
const PROTECTED_PREFIXES = ["/dashboard", "/builder"];

// Rotas de autenticação (para redirecionar quem já está logado).
const AUTH_ROUTES = ["/login", "/signup"];

export const authConfig = {
  // Usamos páginas próprias em vez das telas padrão do NextAuth.
  pages: {
    signIn: "/login",
  },

  // Estratégia JWT é obrigatória para o provider de Credentials.
  session: {
    strategy: "jwt",
  },

  // A lista real de provedores é definida em `auth.ts`. No middleware ela pode
  // ficar vazia, pois só precisamos ler o cookie de sessão.
  providers: [],

  callbacks: {
    // Controla o acesso às rotas com base na sessão. É chamado pelo middleware
    // a cada requisição às rotas do `matcher`.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = nextUrl;

      const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      );
      const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

      // Bloqueia rotas protegidas para visitantes → redireciona ao /login.
      if (isProtected && !isLoggedIn) {
        return false;
      }

      // Usuário logado tentando acessar /login ou /signup → manda ao dashboard.
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
