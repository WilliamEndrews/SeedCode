const fs = require("fs");

const raw = fs.readFileSync(".env.local", "utf8");
raw.split(/\r?\n/).forEach((line) => {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) return;
  let v = m[2];
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[m[1]] = v;
});

const { generateText } = require("ai");
const { groq } = require("@ai-sdk/groq");

(async () => {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: "Diga OK em português",
    });
    console.log("OK:", text);
  } catch (err) {
    console.error("FALHA:", err.message);
    process.exit(1);
  }
})();
