const fs = require("fs");

function loadEnv(file) {
  const env = {};
  try {
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  } catch (e) {
    console.error(`Não foi possível ler ${file}:`, e.message);
    process.exit(1);
  }
  return env;
}

const env = loadEnv(".env.local");

async function testVercel() {
  const token = env.VERCEL_API_TOKEN;
  if (!token) {
    console.log("VERCEL_API_TOKEN: não configurado");
    return;
  }
  const url = new URL("https://api.vercel.com/v2/user");
  if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    console.log("VERCEL_API_TOKEN: FALHA -", data.error?.message || JSON.stringify(data));
    return;
  }
  console.log("VERCEL_API_TOKEN: OK - usuário:", data.user?.username || data.user?.email);
}

async function testGitHub() {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.log("GITHUB_TOKEN: não configurado");
    return;
  }
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "SeedCode",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    console.log("GITHUB_TOKEN: FALHA -", data.message || JSON.stringify(data));
    return;
  }
  console.log("GITHUB_TOKEN: OK - usuário:", data.login);
}

(async () => {
  await testVercel();
  await testGitHub();
})();
