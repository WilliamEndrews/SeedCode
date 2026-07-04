// =============================================================================
// Route Handler — Coleção de projetos (/api/projects)
// -----------------------------------------------------------------------------
// GET  → lista os projetos do usuário autenticado.
// POST → cria um novo projeto para o usuário autenticado.
// Todas as operações exigem sessão válida (NextAuth).
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createProject, listProjectsByOwner } from "@/server/store";

// Schema de validação do corpo de criação de projeto.
const createSchema = z.object({
  name: z.string().min(1, "O nome do projeto é obrigatório."),
  description: z.string().optional(),
  framework: z.string().optional(),
  llm: z.enum(["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemini-2.0-flash"]).optional(),
});

// GET /api/projects — retorna a lista de projetos do usuário logado.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const projects = listProjectsByOwner(session.user.id);
  return NextResponse.json({ projects });
}

// POST /api/projects — cria um novo projeto.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Faz o parse do JSON com tratamento de corpo inválido.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  // Valida os campos recebidos.
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const project = createProject(session.user.id, parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
