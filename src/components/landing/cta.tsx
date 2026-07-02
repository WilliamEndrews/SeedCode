"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="pricing" className="container py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-12 text-center md:p-20"
      >
        <div className="absolute left-1/2 top-0 -z-10 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[100px]" />
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Da ideia ao app em produção, <span className="gradient-text">em minutos</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Comece grátis. Sem cartão de crédito. Traga sua própria chave de LLM e pague só o que usar.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/signup">
              Criar minha conta <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">Explorar o builder</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
