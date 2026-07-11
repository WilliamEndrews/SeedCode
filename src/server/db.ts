// =============================================================================
// Prisma Client (singleton)
// -----------------------------------------------------------------------------
// Em desenvolvimento, o hot-reload do Next.js reavalia os módulos a cada
// alteração. Sem um singleton, cada reload criaria uma nova conexão com o banco,
// esgotando o pool. Guardamos a instância em `globalThis` para reaproveitá-la.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
