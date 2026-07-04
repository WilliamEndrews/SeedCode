"use client";

// Encapsula o SessionProvider do NextAuth para disponibilizar a sessão a
// componentes cliente (via hook `useSession`). Precisa ser um Client Component.
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
