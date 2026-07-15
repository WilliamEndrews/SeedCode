// =============================================================================
// Route Handler — Remover membro de um projeto (/api/projects/[id]/members/[userId])
// -----------------------------------------------------------------------------
// DELETE: remove um membro do projeto (apenas o dono).
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { removeProjectMember } from "@/server/store";

interface RouteContext {
  params: { id: string; userId: string };
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const removed = await removeProjectMember(params.id, session.user.id, params.userId);
  if (!removed) {
    return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
