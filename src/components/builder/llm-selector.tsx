"use client";

import { Check, ChevronDown, Cpu } from "lucide-react";
import { LLM_OPTIONS } from "@/lib/mock-data";
import { useChatStore } from "@/store/chat-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function LLMSelector() {
  const llm = useChatStore((s) => s.llm);
  const setLLM = useChatStore((s) => s.setLLM);
  const current = LLM_OPTIONS.find((o) => o.id === llm) ?? LLM_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          {current.name}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Modelo de IA</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LLM_OPTIONS.map((o) => (
          <DropdownMenuItem key={o.id} onClick={() => setLLM(o.id)} className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{o.name}</span>
                {o.badge && <Badge variant="accent" className="px-1.5 py-0 text-[10px]">{o.badge}</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                {o.provider} · ${o.costPer1kTokens.toFixed(4)}/1k tokens
              </span>
            </div>
            {o.id === llm && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
