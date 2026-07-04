// =============================================================================
// Store em memória (TEMPORÁRIO — Fase 2A)
// -----------------------------------------------------------------------------
// Guarda usuários e projetos apenas em RAM. Serve para dar vida à autenticação
// e à API de projetos enquanto o banco de dados real (Prisma/Supabase) não
// existe. Na Fase 2B este arquivo será substituído por consultas ao banco.
//
// Usamos `globalThis` para preservar os dados entre os hot-reloads do Next.js
// em desenvolvimento (cada reload reavalia o módulo e, sem isso, perderíamos
// os cadastros feitos em tempo de execução).
// =============================================================================

import bcrypt from "bcryptjs";
import type { Project, User } from "@/lib/types";
import { MOCK_PROJECTS } from "@/lib/mock-data";

// Formato do container global que sobrevive aos hot-reloads.
interface SeedCodeStore {
  users: User[];
  projects: Project[];
  seeded: boolean;
}

// Recupera (ou cria) o store único no escopo global.
const globalForStore = globalThis as unknown as { __seedcodeStore?: SeedCodeStore };

const store: SeedCodeStore =
  globalForStore.__seedcodeStore ?? {
    users: [],
    projects: [],
    seeded: false,
  };

globalForStore.__seedcodeStore = store;

// -----------------------------------------------------------------------------
// Semeadura inicial: um usuário demo + os projetos mock atribuídos a ele.
// Executa apenas uma vez por processo.
// -----------------------------------------------------------------------------
if (!store.seeded) {
  const demoUser: User = {
    id: "user-demo",
    name: "Demo SeedCode",
    email: "demo@seedcode.dev",
    // Senha padrão do usuário demo: "seedcode123".
    passwordHash: bcrypt.hashSync("seedcode123", 10),
    provider: "credentials",
    createdAt: new Date().toISOString(),
  };

  store.users.push(demoUser);

  // Vincula os projetos mock ao usuário demo para popular o dashboard.
  store.projects.push(
    ...MOCK_PROJECTS.map((project) => ({ ...project, ownerId: demoUser.id })),
  );

  store.seeded = true;
}

// =============================================================================
// Funções de acesso a USUÁRIOS
// =============================================================================

// Busca um usuário pelo e-mail (case-insensitive).
export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return store.users.find((user) => user.email.toLowerCase() === normalized);
}

// Busca um usuário pelo id.
export function findUserById(id: string): User | undefined {
  return store.users.find((user) => user.id === id);
}

// Cria um novo usuário por credenciais (e-mail + senha), com hash bcrypt.
// Retorna erro se o e-mail já estiver cadastrado.
export async function createUser(params: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = params.email.trim().toLowerCase();

  if (findUserByEmail(email)) {
    throw new Error("E-mail já cadastrado.");
  }

  const user: User = {
    id: `user-${crypto.randomUUID()}`,
    name: params.name.trim(),
    email,
    passwordHash: await bcrypt.hash(params.password, 10),
    provider: "credentials",
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  return user;
}

// Garante que exista um usuário para um login OAuth (Google/GitHub).
// Se já existir pelo e-mail, retorna-o; caso contrário, cria um novo.
export function upsertOAuthUser(params: {
  name: string;
  email: string;
  provider: string;
}): User {
  const existing = findUserByEmail(params.email);
  if (existing) return existing;

  const user: User = {
    id: `user-${crypto.randomUUID()}`,
    name: params.name,
    email: params.email.trim().toLowerCase(),
    provider: params.provider,
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  return user;
}

// Valida credenciais de login comparando a senha com o hash armazenado.
// Retorna o usuário em caso de sucesso ou `null` se as credenciais forem inválidas.
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const user = findUserByEmail(email);
  if (!user?.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

// =============================================================================
// Funções de acesso a PROJETOS
// =============================================================================

// Lista todos os projetos de um usuário, dos mais recentes aos mais antigos.
export function listProjectsByOwner(ownerId: string): Project[] {
  return store.projects
    .filter((project) => project.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Busca um projeto específico garantindo que pertence ao usuário informado.
export function getProjectForOwner(id: string, ownerId: string): Project | undefined {
  return store.projects.find((project) => project.id === id && project.ownerId === ownerId);
}

// Cria um novo projeto vinculado ao usuário.
export function createProject(
  ownerId: string,
  data: {
    name: string;
    description?: string;
    framework?: string;
    llm?: Project["llm"];
  },
): Project {
  const project: Project = {
    id: `proj-${crypto.randomUUID()}`,
    name: data.name,
    description: data.description ?? "",
    status: "draft",
    framework: data.framework ?? "Next.js",
    updatedAt: new Date().toISOString(),
    // Gradiente padrão para a thumbnail do card no dashboard.
    thumbnailGradient: "from-emerald-500 to-teal-600",
    llm: data.llm ?? "claude-3.5-sonnet",
    ownerId,
  };

  store.projects.push(project);
  return project;
}

// Atualiza campos parciais de um projeto do usuário. Retorna o projeto
// atualizado ou `undefined` se ele não existir/pertencer a outro usuário.
export function updateProject(
  id: string,
  ownerId: string,
  patch: Partial<Pick<Project, "name" | "description" | "framework" | "llm" | "status">>,
): Project | undefined {
  const project = getProjectForOwner(id, ownerId);
  if (!project) return undefined;

  Object.assign(project, patch, { updatedAt: new Date().toISOString() });
  return project;
}

// Remove um projeto do usuário. Retorna `true` se algo foi removido.
export function deleteProject(id: string, ownerId: string): boolean {
  const index = store.projects.findIndex(
    (project) => project.id === id && project.ownerId === ownerId,
  );
  if (index === -1) return false;

  store.projects.splice(index, 1);
  return true;
}
