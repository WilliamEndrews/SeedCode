import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectAccess } from "@/server/store";
import { BuilderHeader } from "@/components/builder/builder-header";
import { ChatPanel } from "@/components/builder/chat-panel";
import { PreviewPane } from "@/components/builder/preview-pane";
import { CodePanel } from "@/components/builder/code-panel";
import { ResizableBuilderLayout } from "@/components/builder/resizable-builder-layout";

export default async function BuilderPage({ params }: { params: { projectId: string } }) {
  const session = await auth();

  // Garante que o usuário está autenticado (redundante com o middleware, mas
  // necessário para o TypeScript inferir o id).
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Busca o projeto real do store, permitindo acesso a donos e membros.
  const access = await getProjectAccess(params.projectId, session.user.id);

  // Projeto inexistente ou sem permissão → volta ao dashboard.
  if (!access) {
    redirect("/dashboard");
  }

  const project = access.project;
  const projectName = project.name;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BuilderHeader projectName={projectName} projectId={project.id} role={project.role} />
      {/* Grid com 1 linha de altura fixa (flex-1 do h-screen). Cada célula tem
          min-h-0 + overflow-hidden para que o conteúdo interno role de forma
          independente, sem esticar as demais colunas. */}
      <ResizableBuilderLayout
        chat={<ChatPanel projectId={project.id} initialPrompt={project.description} />}
        preview={<PreviewPane projectId={project.id} projectName={projectName} />}
        code={<CodePanel projectId={project.id} projectName={projectName} />}
      />
    </div>
  );
}
