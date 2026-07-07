// =============================================================================
// Rota /builder/new — Criação de novo projeto
// -----------------------------------------------------------------------------
// Server Component que cria o projeto no store em memória para o usuário
// autenticado e redireciona imediatamente para /builder/[id]. O título é
// extraído do search param `prompt` (quando o usuário digita algo no
// NewAppPrompt) ou recebe um nome padrão.
// =============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createProject } from "@/server/store";

interface Props {
  searchParams: { prompt?: string };
}

export default async function NewBuilderPage({ searchParams }: Props) {
  const session = await auth();

  // O middleware já protege esta rota, mas garantimos o id para o TypeScript.
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Deriva o nome do projeto a partir do prompt do usuário, se houver.
  const rawPrompt = searchParams.prompt?.trim() ?? "";
  const name = rawPrompt.length > 0
    ? rawPrompt.slice(0, 60)           // limita a 60 chars para o título
    : "Novo projeto";

  // Cria o projeto no store e redireciona para o builder com o id gerado.
  const project = createProject(session.user.id, {
    name,
    description: rawPrompt,
  });

  redirect(`/builder/${project.id}`);
}
