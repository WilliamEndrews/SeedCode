import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectForOwner } from "@/server/store";
import { BuilderHeader } from "@/components/builder/builder-header";
import { ChatPanel } from "@/components/builder/chat-panel";
import { PreviewPane } from "@/components/builder/preview-pane";
import { CodePanel } from "@/components/builder/code-panel";

export default async function BuilderPage({ params }: { params: { projectId: string } }) {
  const session = await auth();

  // Garante que o usuário está autenticado (redundante com o middleware, mas
  // necessário para o TypeScript inferir o id).
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Busca o projeto real do store, validando que pertence ao usuário logado.
  const project = await getProjectForOwner(params.projectId, session.user.id);

  // Projeto inexistente ou de outro usuário → volta ao dashboard.
  if (!project) {
    redirect("/dashboard");
  }

  const projectName = project.name;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BuilderHeader projectName={projectName} />
      {/* Grid com 1 linha de altura fixa (flex-1 do h-screen). Cada célula tem
          min-h-0 + overflow-hidden para que o conteúdo interno role de forma
          independente, sem esticar as demais colunas. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 overflow-hidden lg:grid-cols-[360px_1fr_380px]">
        <div className="hidden min-h-0 overflow-hidden border-r border-border/60 lg:block">
          <ChatPanel projectId={project.id} />
        </div>
        <div className="min-h-0 overflow-hidden">
          <PreviewPane projectId={project.id} projectName={projectName} />
        </div>
        <div className="hidden min-h-0 overflow-hidden border-l border-border/60 lg:block">
          <CodePanel projectId={project.id} projectName={projectName} />
        </div>
      </div>
    </div>
  );
}
