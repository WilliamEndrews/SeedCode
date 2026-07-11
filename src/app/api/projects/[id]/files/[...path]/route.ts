// =============================================================================
// Route Handler — Arquivo individual (/api/projects/[id]/files/[...path])
// -----------------------------------------------------------------------------
// GET    → lê o conteúdo de um arquivo pelo path (suporta paths aninhados).
// DELETE → remove o arquivo pelo path.
// O segmento catch-all [...path] permite paths como "src/components/button.tsx".
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteFile, getFile } from "@/server/project-files";

interface RouteContext {
  params: { id: string; path: string[] };
}

// GET /api/projects/[id]/files/[...path] — lê um arquivo.
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const path = params.path.join("/");
  const file = await getFile(params.id, session.user.id, path);

  if (file === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }
  if (file === undefined) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ file });
}

// DELETE /api/projects/[id]/files/[...path] — remove um arquivo.
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const path = params.path.join("/");
  const removed = await deleteFile(params.id, session.user.id, path);
  if (!removed) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
