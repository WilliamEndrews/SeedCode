// =============================================================================
// Validação pós-geração de arquivos
// -----------------------------------------------------------------------------
// Checa arquivos produzidos pelo LLM antes de salvos/persistidos, detectando
// problemas comuns (referências quebradas, placeholders, estrutura incompleta).
// O sistema pode então reenviar uma solicitação de correção automaticamente.
// =============================================================================

import type { ParsedFile } from "./parse-code-blocks";

export interface ValidationResult {
  ok: boolean;
  issues: string[];
}

const PLACEHOLDER_PATTERNS = [
  /\.{3}/, // "..."
  /resto\s+omitido/i,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bcomplete\s+aqui\b/i,
  /\bseu\s+(codigo|código|texto)\s+aqui\b/i,
];

export function validateGeneratedFiles(files: ParsedFile[]): ValidationResult {
  const issues: string[] = [];
  const byPath = new Map(files.map((f) => [f.path.replace(/^\.?\//, ""), f.content]));

  const htmlFiles = files.filter((f) => f.path.endsWith(".html"));
  const hasJsxOrTsx = files.some(
    (f) => f.path.endsWith(".jsx") || f.path.endsWith(".tsx"),
  );

  // 1. Aplicações estáticas precisam de um ponto de entrada.
  if (htmlFiles.length > 0 && !byPath.has("index.html")) {
    issues.push("Falta o arquivo index.html para a aplicação estática.");
  }

  function extractAttribute(content: string, tag: string, attr: string): string[] {
  const matches: string[] = [];
  const regex = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, "gi");
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

// 2. Referências locais em HTML precisam existir entre os arquivos gerados.
  for (const file of htmlFiles) {
    const hrefs = extractAttribute(file.content, "link", "href");
    const srcs = extractAttribute(file.content, "script", "src");

    for (const ref of [...hrefs, ...srcs]) {
      if (
        ref.startsWith("http://") ||
        ref.startsWith("https://") ||
        ref.startsWith("//") ||
        ref.startsWith("data:")
      )
        continue;

      const normalized = ref.replace(/^\.?\//, "");
      if (!byPath.has(normalized)) {
        issues.push(
          `O arquivo ${file.path} referencia "${ref}", mas esse arquivo não foi gerado.`,
        );
      }
    }
  }

  // 3. Detecta placeholders ou trechos claramente incompletos.
  for (const file of files) {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(file.content)) {
        issues.push(
          `O arquivo ${file.path} parece conter seções incompletas ou placeholders.`,
        );
        break;
      }
    }
  }

  // 4. Estrutura mínima de documentos HTML.
  for (const file of htmlFiles) {
    const lower = file.content.toLowerCase();
    if (!lower.includes("<!doctype html>")) {
      issues.push(`${file.path} não declara <!DOCTYPE html>.`);
    }
    if (!lower.includes("<html")) {
      issues.push(`${file.path} não possui tag <html>.`);
    }
    if (!lower.includes("<body")) {
      issues.push(`${file.path} não possui tag <body>.`);
    }
  }

  // 5. Projetos React/Next.js precisam de package.json.
  if (hasJsxOrTsx && !byPath.has("package.json")) {
    issues.push("Projeto React/Next.js precisa de um package.json com as dependências.");
  }

  return { ok: issues.length === 0, issues };
}
