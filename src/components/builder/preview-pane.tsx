"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, RefreshCw, ExternalLink } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

export function PreviewPane() {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const mode = useChatStore((s) => s.mode);
  const visualMode = mode === "visual";

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

      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        <motion.div
          layout
          className={cn(
            "overflow-hidden rounded-xl border bg-background shadow-2xl transition-all",
            device === "desktop" ? "h-full w-full" : "h-[600px] w-[320px]"
          )}
        >
          <MockApp visualMode={visualMode} />
        </motion.div>
      </div>
    </div>
  );
}

function MockApp({ visualMode }: { visualMode: boolean }) {
  const editable = (cls: string) =>
    cn(cls, visualMode && "cursor-pointer outline-dashed outline-1 outline-primary/40 hover:outline-2 hover:outline-primary");

  return (
    <div className="flex h-full flex-col">
      <div className={editable("flex items-center justify-between border-b bg-card px-4 py-3")}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600" />
          <span className="text-sm font-bold">TaskFlow</span>
        </div>
        <div className="h-7 w-16 rounded-md bg-primary/90" />
      </div>

      <div className="flex-1 p-4">
        <h1 className={editable("mb-1 text-lg font-bold")}>Meus Quadros</h1>
        <p className={editable("mb-4 text-xs text-muted-foreground")}>Organize suas tarefas com arrastar e soltar.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "A fazer", count: 3, color: "bg-sky-500" },
            { title: "Em progresso", count: 2, color: "bg-amber-500" },
            { title: "Concluído", count: 5, color: "bg-emerald-500" },
          ].map((col) => (
            <div key={col.title} className={editable("rounded-lg border bg-secondary/40 p-2")}>
              <div className="mb-2 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", col.color)} />
                <span className="text-[11px] font-medium">{col.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{col.count}</span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: col.count > 3 ? 3 : col.count }).map((_, i) => (
                  <div key={i} className="rounded-md border bg-card p-2">
                    <div className="mb-1 h-2 w-3/4 rounded bg-muted-foreground/30" />
                    <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {visualMode && (
        <div className="border-t bg-primary/10 px-4 py-2 text-center text-[11px] text-primary">
          Modo Visual: clique em qualquer elemento para editar
        </div>
      )}
    </div>
  );
}
