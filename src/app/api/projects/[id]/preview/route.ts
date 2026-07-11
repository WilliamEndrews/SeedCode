// =============================================================================
// Route Handler — Preview do projeto (/api/projects/[id]/preview)
// -----------------------------------------------------------------------------
// GET → monta o HTML do sandbox a partir dos arquivos do projeto e o retorna
// como JSON ({ html }) para o PreviewPane injetar no <iframe srcDoc>.
// Retorna { html: null } quando ainda não há um index.html renderizável.
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listFiles } from "@/server/project-files";
import { buildSandboxHtml } from "@/server/sandbox/html-sandbox";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const files = await listFiles(params.id, session.user.id);
  if (files === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const html = buildSandboxHtml(files);
  return NextResponse.json({ html });
}
