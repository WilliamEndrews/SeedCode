// =============================================================================
// Instância principal do NextAuth v5 (Node Runtime)
// -----------------------------------------------------------------------------
// Reúne a configuração base (auth.config.ts) com os provedores e callbacks que
// dependem do servidor (bcrypt, store em memória). Exporta os handlers da rota
// de API e os helpers `auth`, `signIn` e `signOut` usados no app.
// =============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { upsertOAuthUser, verifyCredentials } from "@/server/store";

// Schema de validação das credenciais recebidas no login.
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // ---- Login por e-mail e senha ------------------------------------------
    Credentials({
      // Campos esperados no formulário de login.
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      // Valida o formato e confere a senha contra o hash armazenado.
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await verifyCredentials(email, password);
        if (!user) return null;

        // Objeto mínimo exposto à sessão (nunca inclui o hash da senha).
        return { id: user.id, name: user.name, email: user.email };
      },
    }),

    // ---- Login social (as chaves são lidas das envs AUTH_GOOGLE_* / AUTH_GITHUB_*) ----
    Google,
    GitHub,
  ],

  callbacks: {
    // Herda o callback `authorized` (proteção de rotas) da config base.
    ...authConfig.callbacks,

    // Executado em logins OAuth: garante que o usuário exista no store e
    // sincroniza o id interno para os callbacks seguintes.
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        const internal = upsertOAuthUser({
          name: user.name ?? "Usuário",
          email: user.email ?? "",
          provider: account.provider,
        });
        // Substitui o id do provedor pelo id interno do SeedCode.
        user.id = internal.id;
      }
      return true;
    },

    // Persiste o id do usuário no token JWT no primeiro login.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Expõe o id do usuário no objeto `session.user` no cliente/servidor.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
