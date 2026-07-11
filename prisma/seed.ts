// =============================================================================
// Seed do banco — usuário demo do SeedCode
// -----------------------------------------------------------------------------
// Cria (ou garante) o usuário demo usado nos testes:
//   e-mail: demo@seedcode.dev   senha: seedcode123
// Rode com: npm run db:seed
// =============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@seedcode.dev";
  const password = await bcrypt.hash("seedcode123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Demo SeedCode",
      email,
      password,
      provider: "credentials",
    },
  });

  console.log(`Usuário demo garantido: ${user.email} (id: ${user.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
