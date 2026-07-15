"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoreVertical, ExternalLink, Pencil, Copy, Trash2 } from "lucide-react";
import type { Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const STATUS_MAP: Record<Project["status"], { label: string; variant: "success" | "warning" | "danger" | "secondary" }> = {
  live: { label: "Publicado", variant: "success" },
  building: { label: "Construindo", variant: "warning" },
  draft: { label: "Rascunho", variant: "secondary" },
  error: { label: "Erro", variant: "danger" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `há ${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `há ${hours}h`;
  return "agora";
}

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const status = STATUS_MAP[project.status];
  const isOwner = !project.role || project.role === "owner";

  async function handleRename() {
    const name = window.prompt("Novo nome do projeto:", project.name);
    if (!name || name.trim() === project.name) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        toast.success("Projeto renomeado.");
        router.refresh();
      } else {
        toast.error("Falha ao renomear projeto.");
      }
    } catch {
      toast.error("Erro de conexão ao renomear.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Cópia de ${project.name}` }),
      });
      if (res.ok) {
        toast.success("Projeto duplicado.");
        router.refresh();
      } else {
        toast.error("Falha ao duplicar projeto.");
      }
    } catch {
      toast.error("Erro de conexão ao duplicar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Tem certeza que deseja excluir este projeto?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Projeto excluído.");
        router.refresh();
      } else {
        toast.error("Falha ao excluir projeto.");
      }
    } catch {
      toast.error("Erro de conexão ao excluir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <div className="group overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        <div className={cn("relative h-32 bg-gradient-to-br", project.thumbnailGradient)}>
          <div className="absolute inset-0 grid-bg opacity-20" />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-3 top-3 z-10 rounded-md bg-black/20 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-black/30 disabled:opacity-50"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleRename}>
                  <Pencil className="h-4 w-4" /> Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDuplicate}>
                  <Copy className="h-4 w-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDelete} className="text-red-500">
                  <Trash2 className="h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Link href={`/builder/${project.id}`} className="absolute bottom-3 right-3">
            <ExternalLink className="h-4 w-4 text-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>
        <Link href={`/builder/${project.id}`} className="block p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{project.name}</h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.framework}</span>
            <span>{timeAgo(project.updatedAt)}</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
