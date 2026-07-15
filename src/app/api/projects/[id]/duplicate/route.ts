// =============================================================================
// Route Handler — Duplicar projeto (/api/projects/[id]/duplicate)
// ---------------------------------------------------------------------------
// POST: cria uma cópia do projeto e de todos os seus arquivos ativos.
// Requer sessão válida e posse do projeto.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { duplicateProject } from "@/server/store";

interface RouteContext {
  params: { id: string };
}

const bodySchema = z.object({
  name: z.string().min(1, "O nome do projeto é obrigatório.").optional(),
});

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const project = await duplicateProject(params.id, session.user.id, parsed.data.name);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ project }, { status: 201 });
}
