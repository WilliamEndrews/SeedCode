"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Monitor, Smartphone, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILES_CHANGED_EVENT } from "@/lib/builder-events";
import type { ProjectFile } from "@/lib/types";

const WebContainerPreview = dynamic(
  () => import("./webcontainer-preview").then((m) => m.WebContainerPreview),
  { ssr: false },
);

export function PreviewPane({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [html, setHtml] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<ProjectFile[] | null>(null);
  const [isNodeProject, setIsNodeProject] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Busca o HTML montado pelo sandbox a partir dos arquivos do projeto.
  const loadPreview = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filesRes, previewRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/files`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/preview`, { cache: "no-store" }),
      ]);

      if (filesRes.ok) {
        const { files: projectFiles } = (await filesRes.json()) as { files: ProjectFile[] };
        setFiles(projectFiles);
        setIsNodeProject(projectFiles.some((f) => f.path === "package.json"));
      } else {
        setFiles(null);
        setIsNodeProject(false);
      }

      if (previewRes.ok) {
        const data = (await previewRes.json()) as { html: string | null };
        setHtml(data.html);
      } else {
        setHtml(null);
      }
    } catch {
      setFiles(null);
      setIsNodeProject(false);
      setHtml(null);
      setError("Erro de conexão ao carregar o preview.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Carrega ao montar e sempre que os arquivos do projeto mudarem (evento
  // disparado pelo editor/agente após salvar).
  React.useEffect(() => {
    loadPreview();

    function onFilesChanged(event: Event) {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      if (!detail?.projectId || detail.projectId === projectId) {
        loadPreview();
      }
    }

    window.addEventListener(FILES_CHANGED_EVENT, onFilesChanged);
    return () => window.removeEventListener(FILES_CHANGED_EVENT, onFilesChanged);
  }, [loadPreview, projectId]);

  return (
    <div className="flex h-full flex-col bg-secondary/30">
      <div className="flex items-center justify-between border-b border-border/60 bg-card/50 px-4 py-2.5">
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setDevice("desktop")}
            className={cn("rounded-md p-1.5", device === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={cn("rounded-md p-1.5", device === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-xs text-muted-foreground">
          preview sandbox
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadPreview}
            title="Recarregar preview"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
        <motion.div
          layout
          className={cn(
            "overflow-hidden rounded-xl border bg-background shadow-2xl transition-all",
            device === "desktop" ? "h-full w-full" : "h-[600px] w-[320px]"
          )}
        >
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-red-500">
              <p className="text-sm">{error}</p>
              <button
                onClick={loadPreview}
                className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80"
              >
                Tentar novamente
              </button>
            </div>
          ) : loading && html === null && !isNodeProject ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isNodeProject && files ? (
            <WebContainerPreview files={files} projectName={projectName} />
          ) : html ? (
            <iframe
              title={`Preview de ${projectName}`}
              srcDoc={html}
              sandbox="allow-scripts allow-forms allow-modals"
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            <EmptyPreview projectName={projectName} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Estado vazio exibido enquanto o projeto ainda não tem um index.html.
function EmptyPreview({ projectName }: { projectName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-bold">{projectName}</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Ainda não há preview para este projeto. Descreva o que você quer
          construir no chat à esquerda para gerar o app.
        </p>
      </div>
    </div>
  );
}
