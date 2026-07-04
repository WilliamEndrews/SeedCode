// =============================================================================
// Ampliação de tipos do NextAuth
// -----------------------------------------------------------------------------
// Adiciona o campo `id` ao usuário da sessão e ao token JWT, para que possamos
// identificar o dono dos recursos (ex.: projetos) com segurança de tipos.
// =============================================================================

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
