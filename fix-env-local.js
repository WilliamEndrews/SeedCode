const fs = require("fs");
const path = require("path");

const root = __dirname;
const envPath = path.join(root, ".env");
const localPath = path.join(root, ".env.local");
const backupPath = path.join(root, ".env.local.bak");

function parseEnv(file) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/);
  const values = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      values[m[1]] = v;
    }
  }
  return { raw, lines, values };
}

// Copia .env local valido do .env principal (como fallback)
const env = parseEnv(envPath);
const envLocal = parseEnv(localPath);

// Backup
fs.writeFileSync(backupPath, envLocal.raw, "utf8");
console.log("Backup criado:", backupPath);

// Remove DATABASE_URL e DIRECT_URL de .env.local para nao sobrepor .env
const filtered = envLocal.lines.filter((line) => {
  return !line.match(/^(DATABASE_URL|DIRECT_URL)=/);
});

// Garante nova linha no final
const output = filtered.join("\n") + "\n";
fs.writeFileSync(localPath, output, "utf8");
console.log("Removidos DATABASE_URL e DIRECT_URL de .env.local");

// Testa conexao usando new PrismaClient() (igual ao app)
const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient({ log: ["error"] });
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("PrismaClient OK:", result);
  } catch (err) {
    console.error("PrismaClient FALHA:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
})();
