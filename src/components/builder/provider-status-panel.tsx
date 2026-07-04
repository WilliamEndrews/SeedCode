"use client";

// =============================================================================
// Painel de status dos provedores de IA
// -----------------------------------------------------------------------------
// Exibe, de forma transparente, o consumo do free tier de cada provedor
// (Groq/Google): requisições no minuto e no dia, com barras de progresso e
// indicação de cooldown/indisponibilidade. Atualiza ao montar e a cada 15s.
// =============================================================================

import * as React from "react";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

export function ProviderStatusPanel() {
  const providers = useChatStore((s) => s.providers);
  const fetchProviderStatus = useChatStore((s) => s.fetchProviderStatus);

  // Busca inicial + polling leve para manter o painel atualizado.
  React.useEffect(() => {
    fetchProviderStatus();
    const interval = setInterval(fetchProviderStatus, 15_000);
    return () => clearInterval(interval);
  }, [fetchProviderStatus]);

  if (providers.length === 0) return null;

  return (
    <div className="border-t border-border/60 bg-card/50 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Status dos provedores (free tier)
        </span>
      </div>

      <div className="space-y-2.5">
        {providers.map((p) => {
          // Percentuais de consumo para as barras (limitados a 100%).
          const minutePct = Math.min(100, (p.requestsThisMinute / p.rpmLimit) * 100);
          const dayPct = Math.min(100, (p.requestsToday / p.dailyLimit) * 100);

          return (
            <div key={p.provider} className="rounded-lg border border-border/60 bg-background/60 p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium">{p.label}</span>
                {p.available ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" /> Disponível
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500">
                    <AlertTriangle className="h-3 w-3" /> Em cooldown
                  </span>
                )}
              </div>

              {/* Barra: requisições por minuto */}
              <UsageBar
                label="Por minuto"
                value={p.requestsThisMinute}
                limit={p.rpmLimit}
                pct={minutePct}
              />
              {/* Barra: requisições por dia */}
              <UsageBar
                label="Por dia"
                value={p.requestsToday}
                limit={p.dailyLimit}
                pct={dayPct}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Barra de consumo reutilizável (fica amber/vermelha conforme satura).
function UsageBar({
  label,
  value,
  limit,
  pct,
}: {
  label: string;
  value: number;
  limit: number;
  pct: number;
}) {
  return (
    <div className="mt-1">
      <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
