"use client";

import Link from "next/link";
import { ChevronLeft, GitBranch, Rocket, History, Share2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BuilderHeader({ projectName }: { projectName: string }) {
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
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4" /> Checkpoints
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
        <Button variant="gradient" size="sm">
          <Rocket className="h-4 w-4" /> Publicar
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
