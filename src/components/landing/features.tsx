"use client";

import { motion } from "framer-motion";
import {
  MessageSquareCode,
  Bot,
  Eye,
  GitBranch,
  Gauge,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: MessageSquareCode,
    title: "Chat inteligente",
    desc: "Descreva em linguagem natural e veja o app nascer, com modos Agent, Plan, Visual e Auto.",
  },
  {
    icon: Bot,
    title: "Agentes autônomos",
    desc: "O agente planeja, escreve, testa e corrige — você aprova cada passo quando quiser.",
  },
  {
    icon: Eye,
    title: "Visual Edits",
    desc: "Edite estilos e conteúdo direto no preview. Cada mudança vira um diff limpo e commitável.",
  },
  {
    icon: Gauge,
    title: "Custo transparente",
    desc: "Painel de tokens e custo em tempo real. Traga sua própria chave (BYO-key) e pague menos.",
  },
  {
    icon: Layers,
    title: "Multi-LLM nativo",
    desc: "Escolha entre Llama 3.3, Llama 3.1 e Gemini 2.0 por tarefa, com fallback automático.",
  },
  {
    icon: GitBranch,
    title: "Sem lock-in",
    desc: "Git real, export total do código e deploy em Vercel, Docker ou onde você quiser.",
  },
  {
    icon: Users,
    title: "Colaboração em tempo real",
    desc: "Múltiplos usuários no mesmo builder, com presença e cursores ao vivo.",
  },
  {
    icon: ShieldCheck,
    title: "Qualidade em escala",
    desc: "Lint, type-check e testes no loop do agente + memória de projeto contra regressões.",
  },
];

export function Features() {
  return (
    <section id="features" className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tudo que Lovable e Base44 fazem — <span className="gradient-text">e o que faltava</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Uma plataforma completa de vibe coding, pensada para velocidade, controle e escala.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="group h-full p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
