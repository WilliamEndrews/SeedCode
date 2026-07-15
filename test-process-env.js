const fs = require("fs");
const path = require("path");

function parseEnv(file) {
  const raw = fs.readFileSync(path.join(__dirname, file), "utf8");
  const result = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      result[m[1]] = v;
    }
  }
  return result;
}

const env = parseEnv(".env");
let envLocal = {};
try { envLocal = parseEnv(".env.local"); } catch {}

process.env.DATABASE_URL = envLocal.DATABASE_URL ?? env.DATABASE_URL;
process.env.DIRECT_URL = envLocal.DIRECT_URL ?? env.DIRECT_URL;

console.log("process.env.DATABASE_URL =", process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@"));

const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient({ log: ["error"] });
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("PrismaClient OK:", result);
  } catch (err) {
    console.error("PrismaClient FALHA:", err.message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
})();
