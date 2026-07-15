"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, GitBranch, Rocket, History, Download, Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/builder/share-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/store/toast-store";

export function BuilderHeader({
  projectName,
  projectId,
  role = "owner",
}: {
  projectName: string;
  projectId: string;
  role?: "owner" | "editor" | "viewer";
}) {
  const isOwner = role === "owner";
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-card/50 px-4">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <Logo showText={false} />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{projectName}</span>
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <GitBranch className="h-3 w-3" /> main
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isOwner && (
          <>
            <ExportButton projectId={projectId} projectName={projectName} />
            <GitHubButton projectId={projectId} projectName={projectName} />
          </>
        )}
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4" /> Checkpoints
        </Button>
        {isOwner && <ShareDialog projectId={projectId} />}
        {isOwner && <DeployButton projectId={projectId} projectName={projectName} />}
        <ThemeToggle />
      </div>
    </header>
  );
}

function DeployButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [deploying, setDeploying] = useState(false);

  async function handleDeploy() {
    setDeploying(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deploy`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Falha ao publicar projeto.");
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Projeto publicado! Abrindo URL...");
      } else {
        toast.info("Deployment criado. URL não retornada.");
      }
    } catch {
      toast.error("Erro de conexão ao publicar.");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <Button variant="gradient" size="sm" onClick={handleDeploy} disabled={deploying}>
      <Rocket className="h-4 w-4" /> Publicar
    </Button>
  );
}

function GitHubButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [pushing, setPushing] = useState(false);

  async function handlePush() {
    setPushing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/github`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Falha ao enviar para o GitHub.");
        return;
      }
      const data = (await res.json()) as { repoUrl?: string };
      if (data.repoUrl) {
        const a = document.createElement("a");
        a.href = data.repoUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Repositório criado no GitHub!");
      }
    } catch {
      toast.error("Erro de conexão ao enviar para o GitHub.");
    } finally {
      setPushing(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePush} disabled={pushing}>
      <Github className="h-4 w-4" /> GitHub
    </Button>
  );
}

function ExportButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Falha ao exportar projeto.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/[^a-z0-9_\-\.]/gi, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Projeto exportado como ZIP.");
    } catch {
      toast.error("Erro de conexão ao exportar.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      <Download className="h-4 w-4" /> Exportar
    </Button>
  );
}
