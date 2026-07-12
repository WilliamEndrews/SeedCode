// =============================================================================
// Route Handler — Arquivos do projeto (/api/projects/[id]/files)
// -----------------------------------------------------------------------------
// GET  → lista os arquivos do projeto do usuário.
// POST → cria/atualiza um arquivo { path, content } (upsert pelo path).
// Todas as operações exigem sessão válida e posse do projeto.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { listFiles, writeFile } from "@/server/project-files";
import { checkFileRateLimit } from "@/server/file-rate-limit";

interface RouteContext {
  params: { id: string };
}

const writeSchema = z.object({
  path: z.string().min(1, "O path do arquivo é obrigatório."),
  content: z.string(),
});

// GET /api/projects/[id]/files — lista os arquivos do projeto.
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const files = await listFiles(params.id, session.user.id);
  if (files === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ files });
}

// POST /api/projects/[id]/files — cria ou atualiza um arquivo.
export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rate = checkFileRateLimit(session.user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Muitas requisições. Tente novamente em ${rate.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const file = await writeFile(
    params.id,
    session.user.id,
    parsed.data.path,
    parsed.data.content,
  );
  if (file === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ file }, { status: 201 });
}
