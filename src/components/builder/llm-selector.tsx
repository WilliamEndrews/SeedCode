"use client";

import { AlertTriangle, Check, ChevronDown, Cpu } from "lucide-react";
import { LLM_OPTIONS } from "@/lib/mock-data";
import { useChatStore } from "@/store/chat-store";
import type { LLMProvider } from "@/lib/types";
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
  const providers = useChatStore((s) => s.providers);
  const current = LLM_OPTIONS.find((o) => o.id === llm) ?? LLM_OPTIONS[0];

  // Consulta a disponibilidade de um provedor no snapshot de status.
  const isProviderAvailable = (providerId: LLMProvider) => {
    const status = providers.find((p) => p.provider === providerId);
    // Sem status carregado ainda → assume disponível.
    return status ? status.available : true;
  };

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
        {LLM_OPTIONS.map((o) => {
          const available = isProviderAvailable(o.providerId);
          return (
            <DropdownMenuItem
              key={o.id}
              onClick={() => setLLM(o.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{o.name}</span>
                  {o.badge && (
                    <Badge variant="accent" className="px-1.5 py-0 text-[10px]">
                      {o.badge}
                    </Badge>
                  )}
                  {/* Aviso visual quando o provedor está em cooldown/limite */}
                  {!available && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                      <AlertTriangle className="h-3 w-3" /> limite
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {o.provider} · {o.free ? "grátis" : `$${o.costPer1kTokens.toFixed(4)}/1k`}
                </span>
              </div>
              {o.id === llm && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
