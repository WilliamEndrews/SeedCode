// Route Handler do NextAuth: expõe os endpoints de autenticação
// (/api/auth/signin, /api/auth/callback, /api/auth/session, etc.).
// Os handlers GET e POST vêm da instância configurada em `auth.ts`.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
