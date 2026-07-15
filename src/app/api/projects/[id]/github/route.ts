// =============================================================================
// Route Handler — Enviar projeto para o GitHub (/api/projects/[id]/github)
// -----------------------------------------------------------------------------
// POST: cria um repositório privado no GitHub e faz push inicial dos arquivos.
// Requer GITHUB_TOKEN no .env.local. Opcionalmente aceita `name` e `private`.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getProjectForOwner } from "@/server/store";
import { listFiles } from "@/server/project-files";

interface RouteContext {
  params: { id: string };
}

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  private: z.boolean().optional().default(true),
});

const GITHUB_API = "https://api.github.com";

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

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN não configurado no servidor." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const repoName = parsed.data.name || `seedcode-${project.id}`;
  const isPrivate = parsed.data.private;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  try {
    // Cria o repositório vazio. Se já existir, retorna 422 e paramos por simplicidade.
    const createRepoRes = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: repoName, private: isPrivate, auto_init: false }),
    });

    if (!createRepoRes.ok) {
      const data = (await createRepoRes.json()) as { message?: string };
      return NextResponse.json(
        { error: data.message || "Falha ao criar repositório no GitHub." },
        { status: createRepoRes.status },
      );
    }

    const repo = (await createRepoRes.json()) as { full_name: string; html_url: string };

    // Cria um blob para cada arquivo (base64 cobre texto e binário).
    const blobEntries = await Promise.all(
      files.map(async (file) => {
        const res = await fetch(`${GITHUB_API}/repos/${repo.full_name}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: Buffer.from(file.content, "utf-8").toString("base64"),
            encoding: "base64",
          }),
        });
        if (!res.ok) {
          throw new Error(`Falha ao criar blob para ${file.path}`);
        }
        const data = (await res.json()) as { sha: string };
        return { path: file.path, sha: data.sha };
      }),
    );

    // Cria a árvore de arquivos.
    const treeRes = await fetch(`${GITHUB_API}/repos/${repo.full_name}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tree: blobEntries.map((entry) => ({
          path: entry.path,
          mode: "100644",
          type: "blob",
          sha: entry.sha,
        })),
      }),
    });
    if (!treeRes.ok) {
      throw new Error("Falha ao criar tree no GitHub.");
    }
    const tree = (await treeRes.json()) as { sha: string };

    // Cria o commit inicial.
    const commitRes = await fetch(`${GITHUB_API}/repos/${repo.full_name}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: "Exportação automática do SeedCode",
        tree: tree.sha,
        parents: [],
      }),
    });
    if (!commitRes.ok) {
      throw new Error("Falha ao criar commit no GitHub.");
    }
    const commit = (await commitRes.json()) as { sha: string };

    // Cria a branch main apontando para o commit.
    const refRes = await fetch(`${GITHUB_API}/repos/${repo.full_name}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: "refs/heads/main",
        sha: commit.sha,
      }),
    });
    if (!refRes.ok) {
      throw new Error("Falha ao criar branch main no GitHub.");
    }

    return NextResponse.json({ repoUrl: repo.html_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro de conexão com o GitHub.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
