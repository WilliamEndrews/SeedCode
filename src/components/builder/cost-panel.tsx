"use client";

import { motion } from "framer-motion";
import { Coins, Zap, Activity, TrendingDown } from "lucide-react";
import { useChatStore } from "@/store/chat-store";

export function CostPanel() {
  const cost = useChatStore((s) => s.cost);

  const stats = [
    { icon: Coins, label: "Custo", value: `$${cost.costUsd.toFixed(4)}`, color: "text-emerald-500" },
    { icon: Zap, label: "Tokens", value: cost.tokensUsed.toLocaleString(), color: "text-amber-500" },
    { icon: Activity, label: "Requisições", value: String(cost.requests), color: "text-sky-500" },
  ];

  return (
    <div className="border-t border-border/60 bg-card/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Uso da sessão</span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-500">
          <TrendingDown className="h-3 w-3" /> BYO-key ativo
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-border/60 bg-background/60 p-2 text-center"
          >
            <s.icon className={`mx-auto mb-1 h-3.5 w-3.5 ${s.color}`} />
            <div className="text-sm font-semibold tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
