import { BuilderHeader } from "@/components/builder/builder-header";
import { ChatPanel } from "@/components/builder/chat-panel";
import { PreviewPane } from "@/components/builder/preview-pane";
import { CodePanel } from "@/components/builder/code-panel";
import { getProjectById } from "@/lib/mock-data";

export default function BuilderPage({ params }: { params: { projectId: string } }) {
  const project = getProjectById(params.projectId);
  const projectName = project?.name ?? "Novo projeto";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BuilderHeader projectName={projectName} />
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr_380px]">
        <div className="hidden border-r border-border/60 lg:block">
          <ChatPanel />
        </div>
        <div className="overflow-hidden">
          <PreviewPane />
        </div>
        <div className="hidden border-l border-border/60 lg:block">
          <CodePanel />
        </div>
      </div>
    </div>
  );
}
