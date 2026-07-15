// =============================================================================
// Store de dados — Prisma / PostgreSQL (Supabase)
// -----------------------------------------------------------------------------
// Camada de acesso a dados para USUÁRIOS e PROJETOS. Substitui o antigo store
// em memória por consultas reais ao banco via Prisma. Todas as funções são
// assíncronas. Os mapeadores convertem os models do Prisma (com Date) para os
// tipos de domínio da aplicação (com datas em string ISO).
// =============================================================================

import bcrypt from "bcryptjs";
import type {
  Project as PrismaProject,
  User as PrismaUser,
  ProjectMember as PrismaProjectMember,
  MemberRole,
} from "@prisma/client";
import { prisma } from "@/server/db";
import type { LLMId, Project, ProjectRole, User, ServerUser } from "@/lib/types";

// -----------------------------------------------------------------------------
// Mapeadores model (Prisma) → tipo de domínio (app)
// -----------------------------------------------------------------------------

// Usuário público: nunca expõe passwordHash.
function toUser(u: PrismaUser): User {
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    provider: u.provider,
    createdAt: u.createdAt.toISOString(),
  };
}

// Usuário com hash da senha — uso interno no servidor.
function toServerUser(u: PrismaUser): ServerUser {
  return {
    ...toUser(u),
    passwordHash: u.password ?? "",
  };
}

function toProject(p: PrismaProject): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as Project["status"],
    framework: p.framework,
    updatedAt: p.updatedAt.toISOString(),
    thumbnailGradient: p.thumbnailGradient,
    llm: p.llm as LLMId,
    ownerId: p.ownerId,
  };
}

function toProjectWithRole(
  p: PrismaProject & { members?: { role: MemberRole }[] },
  userId: string,
): Project {
  const role =
    p.ownerId === userId
      ? "owner"
      : (p.members?.[0]?.role.toLowerCase() as "editor" | "viewer" | undefined);
  return { ...toProject(p), role };
}

// =============================================================================
// Funções de acesso a USUÁRIOS
// =============================================================================

// Busca um usuário pelo e-mail (case-insensitive).
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  return user ? toUser(user) : undefined;
}

// Busca um usuário pelo id.
export async function findUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUser(user) : undefined;
}

// Cria um novo usuário por credenciais (e-mail + senha), com hash bcrypt.
// Retorna erro se o e-mail já estiver cadastrado.
export async function createUser(params: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = params.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("E-mail já cadastrado.");
  }

  const user = await prisma.user.create({
    data: {
      name: params.name.trim(),
      email,
      password: await bcrypt.hash(params.password, 10),
      provider: "credentials",
    },
  });

  return toUser(user);
}

// Garante que exista um usuário para um login OAuth (Google/GitHub).
// Se já existir pelo e-mail, retorna-o; caso contrário, cria um novo.
export async function upsertOAuthUser(params: {
  name: string;
  email: string;
  provider: string;
}): Promise<User> {
  const email = params.email.trim().toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: params.name,
      email,
      provider: params.provider,
    },
  });

  return toUser(user);
}

// Valida credenciais de login comparando a senha com o hash armazenado.
// Retorna o usuário em caso de sucesso ou `null` se as credenciais forem inválidas.
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user?.password) return null;

  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? toUser(user) : null;
}

// =============================================================================
// Funções de acesso a PROJETOS
// =============================================================================

// Lista todos os projetos ativos (não deletados) de um usuário, dos mais recentes aos mais antigos.
export async function listProjectsByOwner(ownerId: string): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map(toProject);
}

// Busca um projeto ativo específico garantindo que pertence ao usuário informado.
export async function getProjectForOwner(
  id: string,
  ownerId: string,
): Promise<Project | undefined> {
  const project = await prisma.project.findFirst({ where: { id, ownerId, deletedAt: null } });
  return project ? toProject(project) : undefined;
}

// Lista todos os projetos ativos de um usuário, incluindo os compartilhados.
export async function listProjectsForUser(userId: string): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
  return projects.map((p) => toProjectWithRole(p, userId));
}

export interface ProjectAccess {
  project: Project;
  role: ProjectRole;
}

// Verifica se o usuário é dono ou membro do projeto. Retorna o projeto com a role.
export async function getProjectAccess(
  id: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
  if (!project) return null;

  if (project.ownerId === userId) {
    return { project: toProjectWithRole(project, userId), role: "owner" };
  }

  const memberRole = project.members[0]?.role;
  if (!memberRole) return null;

  return {
    project: toProjectWithRole(project, userId),
    role: memberRole.toLowerCase() as ProjectRole,
  };
}

// Verifica se a role do usuário atende ao nível mínimo exigido.
export function roleMeets(required: ProjectRole, actual: ProjectRole): boolean {
  const levels: Record<ProjectRole, number> = { owner: 3, editor: 2, viewer: 1 };
  return levels[actual] >= levels[required];
}

// Lista membros de um projeto (com dados básicos do usuário).
export async function listProjectMembers(projectId: string, ownerId: string) {
  const isOwner = await prisma.project.count({
    where: { id: projectId, ownerId, deletedAt: null },
  });
  if (isOwner === 0) return null;

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    email: m.user.email,
    name: m.user.name,
    role: m.role.toLowerCase() as ProjectRole,
  }));
}

// Adiciona ou atualiza um membro no projeto a partir do e-mail.
export async function addProjectMember(
  projectId: string,
  ownerId: string,
  email: string,
  role: "EDITOR" | "VIEWER" = "EDITOR",
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId, deletedAt: null },
  });
  if (!project) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return { error: "Usuário não encontrado." };
  if (user.id === ownerId) return { error: "O dono do projeto já tem acesso." };

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: user.id } },
    update: { role },
    create: { projectId, userId: user.id, role },
  });

  return { member: { userId: member.userId, email: user.email, role: member.role.toLowerCase() as ProjectRole } };
}

// Remove um membro do projeto.
export async function removeProjectMember(
  projectId: string,
  ownerId: string,
  userId: string,
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId, deletedAt: null },
  });
  if (!project) return false;

  const result = await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });
  return result.count > 0;
}

// Cria um novo projeto vinculado ao usuário.
export async function createProject(
  ownerId: string,
  data: {
    name: string;
    description?: string;
    framework?: string;
    llm?: Project["llm"];
  },
): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      framework: data.framework ?? "Next.js",
      llm: data.llm ?? "llama-3.3-70b-versatile",
      ownerId,
    },
  });
  return toProject(project);
}

// Atualiza campos parciais de um projeto ativo do usuário. Retorna o projeto
// atualizado ou `undefined` se ele não existir/pertencer a outro usuário.
export async function updateProject(
  id: string,
  ownerId: string,
  patch: Partial<Pick<Project, "name" | "description" | "framework" | "llm" | "status">>,
): Promise<Project | undefined> {
  // Garante a posse antes de atualizar (updateMany não vaza recurso alheio).
  const result = await prisma.project.updateMany({
    where: { id, ownerId, deletedAt: null },
    data: patch,
  });
  if (result.count === 0) return undefined;

  const project = await prisma.project.findUnique({ where: { id } });
  return project ? toProject(project) : undefined;
}

// Soft-delete de um projeto do usuário. Retorna `true` se algo foi deletado.
export async function deleteProject(id: string, ownerId: string): Promise<boolean> {
  const result = await prisma.project.updateMany({
    where: { id, ownerId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

// Duplica um projeto e todos os seus arquivos ativos. Retorna o novo projeto.
export async function duplicateProject(
  id: string,
  ownerId: string,
  newName?: string,
): Promise<Project | undefined> {
  const original = await prisma.project.findFirst({
    where: { id, ownerId, deletedAt: null },
    include: { files: true },
  });
  if (!original) return undefined;

  const activeFiles = original.files.filter((f) => !f.deletedAt);

  const newProject = await prisma.project.create({
    data: {
      name: newName?.trim() || `Cópia de ${original.name}`,
      description: original.description,
      framework: original.framework,
      llm: original.llm,
      thumbnailGradient: original.thumbnailGradient,
      ownerId,
      files: {
        createMany: {
          data: activeFiles.map((f) => ({ path: f.path, content: f.content })),
        },
      },
    },
  });

  return toProject(newProject);
}
