// =============================================================================
// Route Handler — Membros de um projeto (/api/projects/[id]/members)
// -----------------------------------------------------------------------------
// GET  → lista membros (apenas o dono).
// POST → adiciona/atualiza um membro por e-mail (apenas o dono).
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { addProjectMember, listProjectMembers } from "@/server/store";

interface RouteContext {
  params: { id: string };
}

const postSchema = z.object({
  email: z.string().email("E-mail inválido."),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const members = await listProjectMembers(params.id, session.user.id);
  if (members === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: RouteContext) {
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

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const result = await addProjectMember(params.id, session.user.id, parsed.data.email, parsed.data.role);
  if (result === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ member: result.member }, { status: 201 });
}
