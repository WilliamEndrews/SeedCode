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
import type { ProjectFile } from "@/lib/types";

function toProjectFile(f: PrismaProjectFile): ProjectFile {
  return {
    id: f.id,
    projectId: f.projectId,
    path: f.path,
    content: f.content,
    updatedAt: f.updatedAt.toISOString(),
  };
}

// Confirma que o projeto existe e pertence ao usuário. Retorna boolean.
async function userOwnsProject(projectId: string, ownerId: string): Promise<boolean> {
  const count = await prisma.project.count({ where: { id: projectId, ownerId } });
  return count > 0;
}

// Lista todos os arquivos de um projeto do usuário (ordenados por path).
export async function listFiles(
  projectId: string,
  ownerId: string,
): Promise<ProjectFile[] | null> {
  if (!(await userOwnsProject(projectId, ownerId))) return null;

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    orderBy: { path: "asc" },
  });
  return files.map(toProjectFile);
}

// Lê um arquivo específico pelo path. Retorna null se o projeto não pertencer
// ao usuário; undefined se o arquivo não existir.
export async function getFile(
  projectId: string,
  ownerId: string,
  path: string,
): Promise<ProjectFile | null | undefined> {
  if (!(await userOwnsProject(projectId, ownerId))) return null;

  const file = await prisma.projectFile.findUnique({
    where: { projectId_path: { projectId, path } },
  });
  return file ? toProjectFile(file) : undefined;
}

// Cria ou atualiza (upsert) um arquivo pelo path. Toca `updatedAt` do projeto
// para refletir a atividade no dashboard.
export async function writeFile(
  projectId: string,
  ownerId: string,
  path: string,
  content: string,
): Promise<ProjectFile | null> {
  if (!(await userOwnsProject(projectId, ownerId))) return null;

  const file = await prisma.projectFile.upsert({
    where: { projectId_path: { projectId, path } },
    update: { content },
    create: { projectId, path, content },
  });

  // Atualiza o carimbo de tempo do projeto (atividade recente).
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  return toProjectFile(file);
}

// Remove um arquivo pelo path. Retorna false se o projeto não pertencer ao
// usuário ou se nada foi removido.
export async function deleteFile(
  projectId: string,
  ownerId: string,
  path: string,
): Promise<boolean> {
  if (!(await userOwnsProject(projectId, ownerId))) return false;

  const result = await prisma.projectFile.deleteMany({ where: { projectId, path } });
  return result.count > 0;
}
