"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "App de tarefas com Kanban",
  "Loja online com Stripe",
  "Dashboard de analytics",
  "Agente de IA para e-mails",
];

export function NewAppPrompt() {
  const router = useRouter();
  const [value, setValue] = React.useState("");

  function start() {
    // Passa o prompt como search param para a rota /builder/new usar como
    // título/descrição do projeto que será criado no servidor.
    const params = value.trim() ? `?prompt=${encodeURIComponent(value.trim())}` : "";
    router.push(`/builder/new${params}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-8"
    >
      <div className="absolute right-0 top-0 -z-10 h-[200px] w-[300px] rounded-full bg-emerald-500/15 blur-[100px]" />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Wand2 className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">O que vamos construir hoje?</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start();
            }}
            placeholder="Descreva seu app... ex: um SaaS de gestão de clientes com login e cobrança."
            className="min-h-[56px] w-full resize-none rounded-xl border border-input bg-background/60 py-3 pl-9 pr-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
          />
        </div>
        <Button variant="gradient" size="lg" onClick={start} className="sm:self-stretch">
          Gerar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setValue(s)}
            className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
