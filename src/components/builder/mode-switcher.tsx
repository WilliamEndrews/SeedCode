"use client";

import { Bot, ListTodo, MousePointerClick, Wand2 } from "lucide-react";
import type { AgentMode } from "@/lib/types";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

const MODES: { id: AgentMode; label: string; icon: typeof Bot; hint: string }[] = [
  { id: "agent", label: "Agent", icon: Bot, hint: "Executa tarefas de forma autônoma" },
  { id: "plan", label: "Plan", icon: ListTodo, hint: "Planeja antes de executar" },
  { id: "visual", label: "Visual", icon: MousePointerClick, hint: "Edite direto no preview" },
  { id: "auto", label: "Auto", icon: Wand2, hint: "Superagent proativo" },
];

export function ModeSwitcher() {
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            title={m.hint}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <m.icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
