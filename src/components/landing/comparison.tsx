"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type Cell = "yes" | "no" | "partial";

const ROWS: { feature: string; seedcode: Cell; lovable: Cell; base44: Cell }[] = [
  { feature: "Chat + Agent/Plan/Visual", seedcode: "yes", lovable: "yes", base44: "partial" },
  { feature: "Superagent proativo (Auto)", seedcode: "yes", lovable: "partial", base44: "yes" },
  { feature: "Multi-LLM (GPT/Claude/Grok/Gemini)", seedcode: "yes", lovable: "no", base44: "no" },
  { feature: "Custo transparente + BYO-key", seedcode: "yes", lovable: "no", base44: "no" },
  { feature: "Export total de código", seedcode: "yes", lovable: "yes", base44: "partial" },
  { feature: "Checkpoints reversíveis (time-travel)", seedcode: "yes", lovable: "partial", base44: "no" },
  { feature: "Colaboração em tempo real", seedcode: "yes", lovable: "no", base44: "no" },
  { feature: "Canvas de orquestração de agentes", seedcode: "yes", lovable: "no", base44: "no" },
];

function CellIcon({ v }: { v: Cell }) {
  if (v === "yes") return <Check className="mx-auto h-5 w-5 text-emerald-500" />;
  if (v === "no") return <X className="mx-auto h-5 w-5 text-red-400/70" />;
  return <Minus className="mx-auto h-5 w-5 text-amber-500" />;
}

export function Comparison() {
  return (
    <section id="compare" className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Como o SeedCode <span className="gradient-text">se compara</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          O melhor dos dois mundos, com inovações que resolvem as dores reais dos usuários.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="p-4 text-left font-medium">Recurso</th>
              <th className="p-4 text-center font-semibold text-primary">SeedCode</th>
              <th className="p-4 text-center font-medium text-muted-foreground">Lovable</th>
              <th className="p-4 text-center font-medium text-muted-foreground">Base44</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.feature} className="border-b last:border-0 transition-colors hover:bg-secondary/30">
                <td className="p-4 text-left">{r.feature}</td>
                <td className="bg-primary/5 p-4"><CellIcon v={r.seedcode} /></td>
                <td className="p-4"><CellIcon v={r.lovable} /></td>
                <td className="p-4"><CellIcon v={r.base44} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
}
