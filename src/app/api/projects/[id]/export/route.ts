// =============================================================================
// Route Handler — Exportar projeto como ZIP (/api/projects/[id]/export)
// -----------------------------------------------------------------------------
// GET: retorna um arquivo .zip com todos os arquivos ativos do projeto.
// Requer sessão válida e posse do projeto.
// =============================================================================

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/auth";
import { listFiles } from "@/server/project-files";
import { getProjectForOwner } from "@/server/store";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const project = await getProjectForOwner(params.id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const files = await listFiles(params.id, session.user.id);
  if (files === null) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const uint8 = await zip.generateAsync({ type: "uint8array" });
  const buffer = Buffer.from(uint8);
  const arrayBuffer = buffer.buffer as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/zip" });

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9_\-\.]/gi, "_")}.zip"`,
    },
  });
}
