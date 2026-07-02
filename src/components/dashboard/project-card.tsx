"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MoreVertical, ExternalLink } from "lucide-react";
import type { Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const status = STATUS_MAP[project.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link href={`/builder/${project.id}`}>
        <div className="group overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
          <div className={cn("relative h-32 bg-gradient-to-br", project.thumbnailGradient)}>
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute right-3 top-3 flex gap-1.5">
              <button className="rounded-md bg-black/20 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <ExternalLink className="absolute bottom-3 right-3 h-4 w-4 text-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="truncate font-semibold">{project.name}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{project.framework}</span>
              <span>{timeAgo(project.updatedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
