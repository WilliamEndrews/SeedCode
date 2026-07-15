// =============================================================================
// Sistema de arquivos virtual do projeto — Prisma
// -----------------------------------------------------------------------------
// CRUD dos arquivos (ProjectFile) que compõem um projeto. Cada operação valida
// a posse do projeto pelo usuário antes de tocar nos arquivos, evitando acesso
// a recursos de terceiros. Os arquivos são identificados por `path` único
// dentro de cada projeto (@@unique([projectId, path])).
// =============================================================================

import type { ProjectFile as PrismaProjectFile } from "@prisma/client";
import { prisma } from "@/server/db";
import type { ProjectFile, ProjectRole } from "@/lib/types";
import { getProjectAccess, roleMeets } from "@/server/store";

function toProjectFile(f: PrismaProjectFile): ProjectFile {
  return {
    id: f.id,
    projectId: f.projectId,
    path: f.path,
    content: f.content,
    updatedAt: f.updatedAt.toISOString(),
  };
}

// Confirma que o projeto existe e que o usuário tem pelo menos a role exigida.
async function requireProjectAccess(
  projectId: string,
  userId: string,
  requiredRole: ProjectRole,
): Promise<boolean> {
  const access = await getProjectAccess(projectId, userId);
  if (!access) return false;
  return roleMeets(requiredRole, access.role);
}

// Lista todos os arquivos ativos de um projeto que o usuário pode ver.
export async function listFiles(
  projectId: string,
  userId: string,
): Promise<ProjectFile[] | null> {
  if (!(await requireProjectAccess(projectId, userId, "viewer"))) return null;

  const files = await prisma.projectFile.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { path: "asc" },
  });
  return files.map(toProjectFile);
}

// Lê um arquivo ativo específico pelo path. Retorna null se o usuário não
// tiver acesso; undefined se o arquivo não existir ou estiver deletado.
export async function getFile(
  projectId: string,
  userId: string,
  path: string,
): Promise<ProjectFile | null | undefined> {
  if (!(await requireProjectAccess(projectId, userId, "viewer"))) return null;

  const file = await prisma.projectFile.findUnique({
    where: { projectId_path: { projectId, path } },
  });
  if (!file || file.deletedAt) return undefined;
  return toProjectFile(file);
}

// Cria ou atualiza (upsert) um arquivo pelo path. Requer papel de editor.
// Toca `updatedAt` do projeto para refletir a atividade no dashboard.
export async function writeFile(
  projectId: string,
  userId: string,
  path: string,
  content: string,
): Promise<ProjectFile | null> {
  if (!(await requireProjectAccess(projectId, userId, "editor"))) return null;

  const existing = await prisma.projectFile.findUnique({
    where: { projectId_path: { projectId, path } },
  });

  let file;
  if (existing) {
    file = await prisma.projectFile.update({
      where: { id: existing.id },
      data: { content, deletedAt: existing.deletedAt ? null : undefined },
    });
  } else {
    file = await prisma.projectFile.create({
      data: { projectId, path, content },
    });
  }

  // Atualiza o carimbo de tempo do projeto (atividade recente).
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  return toProjectFile(file);
}

// Soft-delete de um arquivo pelo path. Requer papel de editor.
export async function deleteFile(
  projectId: string,
  userId: string,
  path: string,
): Promise<boolean> {
  if (!(await requireProjectAccess(projectId, userId, "editor"))) return false;

  const result = await prisma.projectFile.updateMany({
    where: { projectId, path, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
