// =============================================================================
// Parser de blocos de código gerados pela IA
// -----------------------------------------------------------------------------
// O Agente SeedCode gera arquivos em blocos de código cercados (```), cujo
// info-string identifica o caminho do arquivo. Suportamos os formatos:
//   ```path=index.html            → path explícito
//   ```html path=styles.css       → linguagem + path explícito
//   ```index.html                 → o próprio info-string é o nome do arquivo
// Este módulo é puro (sem I/O), reutilizável no cliente e no servidor.
// =============================================================================

export interface ParsedFile {
  path: string;
  content: string;
  // Linguagem declarada no info-string (quando houver), só informativo.
  lang?: string;
}

// Regex de blocos cercados: captura o info-string e o conteúdo.
// Usa ``` ou ~~~ como cerca e tolera indentação/CRLF.
const FENCE_RE = /(?:^|\n)[ \t]*(`{3,}|~{3,})[ \t]*([^\n]*)\n([\s\S]*?)\n[ \t]*\1[ \t]*(?=\n|$)/g;

// Fallback para blocos que só informam a linguagem (ex.: ```html, ```css).
// Usado quando o modelo não segue o protocolo path=... do SeedCode.
const DEFAULT_FILES_BY_LANG: Record<string, string> = {
  html: "index.html",
  htm: "index.html",
  css: "styles.css",
  javascript: "script.js",
  js: "script.js",
  typescript: "script.ts",
  ts: "script.ts",
  jsx: "index.jsx",
  tsx: "index.tsx",
};

// Extrai o path do info-string, se houver. Retorna { path, lang } ou null.
function parseInfoString(info: string): { path: string; lang?: string } | null {
  const trimmed = info.trim();
  if (!trimmed) return null;

  // 1. Formato com path explícito: aceita path=, file=, title= (com/sem aspas).
  const explicit = trimmed.match(/(?:path|file|title|name)\s*=\s*["']?([^"'\s]+)["']?/i);
  if (explicit?.[1]) {
    // A linguagem é o primeiro token, se não for o próprio atributo.
    const firstToken = trimmed.split(/\s+/)[0];
    const lang = firstToken.includes("=") ? undefined : firstToken;
    return { path: explicit[1], lang };
  }

  // 2. Info-string é o próprio nome do arquivo (tem extensão e sem espaços).
  const tokens = trimmed.split(/\s+/);
  const candidate = tokens[0];
  if (candidate && /^[\w./-]+\.[A-Za-z0-9]+$/.test(candidate)) {
    return { path: candidate };
  }

  return null;
}

// Fallback: info-string é apenas a linguagem (ex.: ```html, ```css).
// Usa um nome padrão conhecido para que o SeedCode salve o arquivo.
function inferPathFromLanguage(lang: string): string | null {
  return DEFAULT_FILES_BY_LANG[lang.toLowerCase()] ?? null;
}

// Percorre o texto e retorna todos os arquivos identificados (com path).
// Blocos sem path (ex.: exemplos ilustrativos) são ignorados de propósito.
export function parseCodeBlocks(text: string): ParsedFile[] {
  // Deduplica pelo path mantendo a ÚLTIMA ocorrência (última versão vence).
  const byPath = new Map<string, ParsedFile>();

  let match: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((match = FENCE_RE.exec(text)) !== null) {
    const info = match[2] ?? "";
    let content = match[3] ?? "";

    // 1. Tenta o path no info-string da cerca (```html path=index.html).
    let parsed = parseInfoString(info);

    // 2. Fallback: alguns modelos colocam o path na PRIMEIRA LINHA do conteúdo
    //    (ex.: ```html \n path=index.html \n <código>). Detecta e remove.
    if (!parsed) {
      const nl = content.indexOf("\n");
      const firstLine = (nl === -1 ? content : content.slice(0, nl)).trim();
      const fromFirstLine = parseInfoString(firstLine);
      if (fromFirstLine) {
        parsed = { path: fromFirstLine.path, lang: info.trim() || fromFirstLine.lang };
        content = nl === -1 ? "" : content.slice(nl + 1);
      }
    }

    // 3. Fallback final: info-string é apenas a linguagem (```html, ```css).
    if (!parsed) {
      const inferred = inferPathFromLanguage(info.trim());
      if (inferred) {
        parsed = { path: inferred, lang: info.trim().toLowerCase() };
      }
    }

    if (!parsed) continue;

    byPath.set(parsed.path, {
      path: parsed.path.replace(/^\.?\//, ""), // normaliza "./x" e "/x" → "x"
      content,
      lang: parsed.lang,
    });
  }

  return Array.from(byPath.values());
}
