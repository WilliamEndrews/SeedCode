// =============================================================================
// Route Handler — Projeto individual (/api/projects/[id])
// -----------------------------------------------------------------------------
// GET    → retorna um projeto específico do usuário.
// PATCH  → atualiza campos parciais do projeto.
// DELETE → remove o projeto.
// Todas as operações verificam a sessão e a posse do recurso.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { deleteProject, getProjectForOwner, updateProject } from "@/server/store";

// Parâmetros de rota dinâmicos.
interface RouteContext {
  params: { id: string };
}

// Schema de atualização parcial (todos os campos são opcionais).
const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  framework: z.string().optional(),
  llm: z.enum(["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemini-2.0-flash"]).optional(),
  status: z.enum(["draft", "building", "live", "error"]).optional(),
});

// GET /api/projects/[id] — retorna o projeto se pertencer ao usuário.
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const project = getProjectForOwner(params.id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

// PATCH /api/projects/[id] — atualiza campos do projeto.
export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const project = updateProject(params.id, session.user.id, parsed.data);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

// DELETE /api/projects/[id] — remove o projeto do usuário.
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const removed = deleteProject(params.id, session.user.id);
  if (!removed) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
