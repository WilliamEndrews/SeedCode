"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Github, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />

      <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="default" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            Multi-LLM · Llama 3.3 · Gemini 2.0 · fallback automático
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl"
        >
          Construa apps completos com IA,{" "}
          <span className="gradient-text">mantendo controle total</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          O SeedCode une o melhor de Lovable e Base44: chat inteligente, edição visual,
          agentes autônomos e backend robusto — com custo transparente e código 100% seu,
          sem lock-in.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button variant="gradient" size="lg" asChild>
            <Link href="/signup">
              Começar a construir <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">
              <Play className="h-4 w-4" /> Ver demo
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Github className="h-4 w-4" /> Export total de código · Deploy em qualquer lugar
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35 }}
      className="mt-16 w-full max-w-5xl"
    >
      <div className="glass overflow-hidden rounded-2xl shadow-2xl shadow-emerald-500/5">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="ml-3 rounded-md bg-secondary px-3 py-1 text-xs text-muted-foreground">
            seedcode.app/builder
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border/60 md:grid-cols-[300px_1fr]">
          <div className="space-y-3 bg-card p-4">
            <div className="rounded-lg bg-primary/10 p-3 text-left text-sm">
              Crie um app de tarefas com login e quadros Kanban.
            </div>
            <div className="rounded-lg bg-secondary p-3 text-left text-xs text-muted-foreground">
              <span className="text-primary">●</span> Analisando requisitos...
              <br />
              <span className="text-primary">●</span> Gerando componentes...
              <br />
              <span className="text-emerald-400">✓</span> Preview pronto
            </div>
          </div>
          <div className="flex min-h-[240px] items-center justify-center bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-8">
            <div className="grid w-full max-w-sm grid-cols-3 gap-3">
              {["To do", "Doing", "Done"].map((col) => (
                <div key={col} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">{col}</div>
                  <div className="h-12 rounded-lg border border-border/60 bg-card" />
                  <div className="h-12 rounded-lg border border-border/60 bg-card" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
