// =============================================================================
// Store de dados — Prisma / PostgreSQL (Supabase)
// -----------------------------------------------------------------------------
// Camada de acesso a dados para USUÁRIOS e PROJETOS. Substitui o antigo store
// em memória por consultas reais ao banco via Prisma. Todas as funções são
// assíncronas. Os mapeadores convertem os models do Prisma (com Date) para os
// tipos de domínio da aplicação (com datas em string ISO).
// =============================================================================

import bcrypt from "bcryptjs";
import type { Project as PrismaProject, User as PrismaUser } from "@prisma/client";
import { prisma } from "@/server/db";
import type { LLMId, Project, User } from "@/lib/types";

// -----------------------------------------------------------------------------
// Mapeadores model (Prisma) → tipo de domínio (app)
// -----------------------------------------------------------------------------

function toUser(u: PrismaUser): User {
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    passwordHash: u.password ?? undefined,
    provider: u.provider,
    createdAt: u.createdAt.toISOString(),
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

// Lista todos os projetos de um usuário, dos mais recentes aos mais antigos.
export async function listProjectsByOwner(ownerId: string): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map(toProject);
}

// Busca um projeto específico garantindo que pertence ao usuário informado.
export async function getProjectForOwner(
  id: string,
  ownerId: string,
): Promise<Project | undefined> {
  const project = await prisma.project.findFirst({ where: { id, ownerId } });
  return project ? toProject(project) : undefined;
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

// Atualiza campos parciais de um projeto do usuário. Retorna o projeto
// atualizado ou `undefined` se ele não existir/pertencer a outro usuário.
export async function updateProject(
  id: string,
  ownerId: string,
  patch: Partial<Pick<Project, "name" | "description" | "framework" | "llm" | "status">>,
): Promise<Project | undefined> {
  // Garante a posse antes de atualizar (updateMany não vaza recurso alheio).
  const result = await prisma.project.updateMany({
    where: { id, ownerId },
    data: patch,
  });
  if (result.count === 0) return undefined;

  const project = await prisma.project.findUnique({ where: { id } });
  return project ? toProject(project) : undefined;
}

// Remove um projeto do usuário. Retorna `true` se algo foi removido.
export async function deleteProject(id: string, ownerId: string): Promise<boolean> {
  const result = await prisma.project.deleteMany({ where: { id, ownerId } });
  return result.count > 0;
}
