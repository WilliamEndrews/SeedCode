"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PreviewPane({ projectName }: { projectName: string }) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");

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
          localhost:3000
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <ExternalLink className="h-4 w-4" />
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
          <EmptyPreview projectName={projectName} />
        </motion.div>
      </div>
    </div>
  );
}

// Estado vazio exibido enquanto o app ainda não foi gerado. A geração real de
// preview será implementada em fase futura (sandbox/execução).
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
