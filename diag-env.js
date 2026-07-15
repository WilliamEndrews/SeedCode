const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
let raw;
try {
  raw = fs.readFileSync(envPath, "utf8");
} catch (e) {
  console.error("Nao foi possivel ler .env:", e.message);
  process.exit(1);
}

const env = {};
const lines = raw.split(/\r?\n/);
for (const line of lines) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match) {
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
}

function mask(url) {
  if (!url) return "undefined";
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

const envLocal = {};
const localPath = path.join(__dirname, ".env.local");
if (fs.existsSync(localPath)) {
  const rawLocal = fs.readFileSync(localPath, "utf8");
  for (const line of rawLocal.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envLocal[match[1]] = value;
    }
  }
}

console.log("=== .env ===");
console.log("DATABASE_URL:", mask(env.DATABASE_URL));
console.log("DIRECT_URL  :", mask(env.DIRECT_URL));
console.log("");

if (fs.existsSync(localPath)) {
  console.log("=== .env.local ===");
  console.log("DATABASE_URL:", mask(envLocal.DATABASE_URL));
  console.log("DIRECT_URL  :", mask(envLocal.DIRECT_URL));
  console.log("");
}

function inspect(url, name) {
  if (!url) return console.log(`${name}: nao definido`);
  const pgbouncer = url.includes("pgbouncer=true");
  const port = url.match(/:(\d+)\//)?.[1] ?? "?";
  const user = url.match(/:\/\/([^:]+):/)?.[1] ?? url;
  console.log(`${name}: user=${user} port=${port} pgbouncer=${pgbouncer}`);
}

inspect(env.DATABASE_URL, "DATABASE_URL");
inspect(env.DIRECT_URL, "DIRECT_URL");

if (fs.existsSync(localPath)) {
  console.log("DATABASE_URL .env === .env.local:", env.DATABASE_URL === envLocal.DATABASE_URL);
  console.log("DIRECT_URL .env === .env.local:", env.DIRECT_URL === envLocal.DIRECT_URL);
}
console.log("");

async function test(name, url) {
  if (!url) {
    console.log(`${name}: skip (URL ausente)`);
    return;
  }
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  });
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log(`${name}: OK`, result);
  } catch (err) {
    console.error(`${name}: FALHA -`, err.message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function testProcessEnv(name) {
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.DIRECT_URL = env.DIRECT_URL;
  if (envLocal.DATABASE_URL) {
    process.env.DATABASE_URL = envLocal.DATABASE_URL;
    process.env.DIRECT_URL = envLocal.DIRECT_URL;
  }
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({ log: ["error"] });
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log(`${name}: OK`, result);
  } catch (err) {
    console.error(`${name}: FALHA -`, err.message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

(async () => {
  await test("DATABASE_URL", env.DATABASE_URL);
  await test("DIRECT_URL", env.DIRECT_URL);
  await testProcessEnv("PrismaClient usando process.env");
})();
