// =============================================================================
// Sandbox HTML (MVP multi-arquivo)
// -----------------------------------------------------------------------------
// Monta um documento HTML único a partir dos arquivos do projeto para exibir no
// preview via <iframe srcDoc>. Estratégia:
//   - Base: o arquivo `index.html`.
//   - Referências <link rel="stylesheet" href="X"> e <script src="X"> são
//     RESOLVIDAS contra os arquivos do projeto e inlinadas (<style>/<script>).
//   - Fallback: se existir styles.css/script.js e não tiverem sido referenciados
//     explicitamente, são injetados mesmo assim.
// Isso permite ver apps estáticos (HTML/CSS/JS) sem bundler. Frameworks com
// build (React/Next) serão suportados depois via WebContainers/E2B.
// =============================================================================

import type { ProjectFile } from "@/lib/types";

const CSS_FALLBACK = ["styles.css", "style.css", "index.css"];
const JS_FALLBACK = ["script.js", "app.js", "index.js", "main.js"];

// Normaliza um path/href para comparação: minúsculas, sem "./", "/" ou query.
function normalize(p: string): string {
  return p
    .trim()
    .replace(/^\.?\//, "")
    .replace(/[?#].*$/, "")
    .toLowerCase();
}

// Retorna o HTML final para o iframe, ou null se não houver index.html.
export function buildSandboxHtml(files: ProjectFile[]): string | null {
  if (files.length === 0) return null;

  const indexHtml = files.find((f) => normalize(f.path) === "index.html");
  if (!indexHtml) return null;

  // Índice de arquivos por path normalizado para resolução rápida.
  const byPath = new Map<string, ProjectFile>();
  for (const f of files) byPath.set(normalize(f.path), f);

  // Marca quais arquivos já foram inlinados via referência explícita.
  const inlined = new Set<string>();

  let html = indexHtml.content;

  // 1. Resolve <link rel="stylesheet" href="X"> → <style>...</style>.
  html = html.replace(
    /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (tag, href: string) => {
      // Só mexe em folhas de estilo (ignora favicons, preloads etc.).
      if (!/stylesheet/i.test(tag) && !/\.css(\?|#|$)/i.test(href)) return tag;
      const file = byPath.get(normalize(href));
      if (!file) return tag;
      inlined.add(normalize(href));
      return `<style>\n${file.content}\n</style>`;
    },
  );

  // 2. Resolve <script src="X"></script> → <script>...</script>.
  html = html.replace(
    /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag, src: string) => {
      const file = byPath.get(normalize(src));
      if (!file) return tag;
      inlined.add(normalize(src));
      return `<script>\n${file.content}\n</script>`;
    },
  );

  // 3. Fallback de CSS: injeta a primeira folha conhecida não referenciada.
  const cssFallback = CSS_FALLBACK.map((n) => byPath.get(n)).find(
    (f) => f && !inlined.has(normalize(f.path)),
  );
  if (cssFallback) {
    const styleTag = `<style>\n${cssFallback.content}\n</style>`;
    html = html.includes("</head>")
      ? html.replace("</head>", `${styleTag}\n</head>`)
      : `${styleTag}\n${html}`;
  }

  // 4. Fallback de JS: injeta o primeiro script conhecido não referenciado.
  const jsFallback = JS_FALLBACK.map((n) => byPath.get(n)).find(
    (f) => f && !inlined.has(normalize(f.path)),
  );
  if (jsFallback) {
    const scriptTag = `<script>\n${jsFallback.content}\n</script>`;
    html = html.includes("</body>")
      ? html.replace("</body>", `${scriptTag}\n</body>`)
      : `${html}\n${scriptTag}`;
  }

  return html;
}
