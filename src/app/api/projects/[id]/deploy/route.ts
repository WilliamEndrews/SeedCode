// =============================================================================
// Route Handler — Publicar projeto na Vercel (/api/projects/[id]/deploy)
// -----------------------------------------------------------------------------
// POST: cria um deployment na Vercel com os arquivos atuais do projeto.
// Requer VERCEL_API_TOKEN no .env.local. VERCEL_TEAM_ID é opcional.
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectForOwner } from "@/server/store";
import { listFiles } from "@/server/project-files";

interface RouteContext {
  params: { id: string };
}

interface VercelDeploymentResponse {
  id?: string;
  url?: string;
  alias?: string[];
  error?: { message?: string; code?: string };
}

export async function POST(request: Request, { params }: RouteContext) {
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

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "VERCEL_API_TOKEN não configurado no servidor." },
      { status: 500 },
    );
  }

  // Monta os arquivos no formato da Vercel API (base64 é seguro para texto e binário).
  const vercelFiles = files.map((file) => ({
    file: file.path,
    data: Buffer.from(file.content, "utf-8").toString("base64"),
    encoding: "base64" as const,
  }));

  const name = `seedcode-${project.id}`;

  const url = new URL("https://api.vercel.com/v13/deployments");
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) url.searchParams.set("teamId", teamId);
  // Pula a confirmação de detecção automática de framework para novos projetos.
  url.searchParams.set("skipAutoDetectionConfirmation", "1");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        files: vercelFiles,
        target: "production",
        projectSettings: {
          framework: null,
          buildCommand: null,
          devCommand: null,
          installCommand: null,
          outputDirectory: null,
          commandForIgnoringBuildStep: null,
          rootDirectory: null,
          nodeVersion: "20.x",
        },
      }),
    });

    const data = (await res.json()) as VercelDeploymentResponse;

    if (!res.ok) {
      const message = data.error?.message || "Falha ao criar deployment na Vercel.";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({
      id: data.id,
      url: data.url ? `https://${data.url}` : undefined,
      alias: data.alias,
    });
  } catch {
    return NextResponse.json({ error: "Erro de conexão com a Vercel." }, { status: 503 });
  }
}
