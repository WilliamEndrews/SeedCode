"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Wand2, Users, Palette, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Site para minha loja de doces",
  "Página de vendas para um curso online",
  "Portfólio de fotografia",
  "Landing page para um evento",
  "App simples de lista de tarefas",
];

const STYLE_OPTIONS = [
  { id: "moderno", label: "Moderno & clean", icon: <Sparkles className="h-4 w-4" /> },
  { id: "divertido", label: "Divertido & colorido", icon: <Palette className="h-4 w-4" /> },
  { id: "elegante", label: "Elegante & minimalista", icon: <Target className="h-4 w-4" /> },
  { id: "tecnico", label: "Técnico & profissional", icon: <Lightbulb className="h-4 w-4" /> },
];

const PURPOSE_OPTIONS = [
  { id: "divulgar", label: "Divulgar produtos ou serviços" },
  { id: "capturar", label: "Capturar contatos / leads" },
  { id: "vender", label: "Vender online" },
  { id: "portifolio", label: "Mostrar portfólio" },
  { id: "evento", label: "Organizar um evento" },
  { id: "conteudo", label: "Blog ou conteúdo" },
];

export function NewAppPrompt() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [idea, setIdea] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function composePrompt() {
    const parts: string[] = [];
    parts.push(`Crie um site/aplicação para a seguinte ideia: "${idea.trim()}".`);
    if (audience.trim()) parts.push(`O público-alvo principal é: ${audience.trim()}.`);
    if (style) {
      const styleLabel = STYLE_OPTIONS.find((s) => s.id === style)?.label.toLowerCase() ?? style;
      parts.push(`Use um visual ${styleLabel}, com paleta de cores e tipografia modernas, atraentes e adequadas ao público.`);
    }
    if (purpose) {
      const purposeLabel = PURPOSE_OPTIONS.find((p) => p.id === purpose)?.label.toLowerCase() ?? purpose;
      parts.push(`O objetivo principal do site é ${purposeLabel}.`);
    }
    parts.push(
      `Gere uma aplicação COMPLETA, funcional e visualmente profissional, com todos os arquivos necessários. ` +
        `Prefira HTML, CSS e JS estáticos para máxima simplicidade, a menos que a ideia exija algo dinâmico. ` +
        `Inclua navbar, hero, seções de conteúdo relevantes, call-to-action e rodapé. ` +
        `Use ícones via CDN (Lucide ou FontAwesome) e imagens placeholder do Unsplash quando fizer sentido. ` +
        `Explique brevemente as escolhas de design e liste os arquivos criados.`
    );
    return parts.join(" ");
  }

  function create() {
    if (!idea.trim()) return;
    setLoading(true);
    const prompt = composePrompt();
    const params = new URLSearchParams({ prompt, framework: "static" });
    router.push(`/builder/new?${params.toString()}`);
  }

  function useSuggestion(text: string) {
    setIdea(text);
    setStep(2);
  }

  const canContinue = idea.trim().length > 0;
  const canCreate = canContinue && style !== "" && purpose !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-8"
    >
      <div className="absolute right-0 top-0 -z-10 h-[200px] w-[300px] rounded-full bg-emerald-500/15 blur-[100px]" />

      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">O que vamos construir hoje?</h2>
          <p className="text-xs text-muted-foreground">
            {step === 1
              ? "Descreva sua ideia em uma frase. A IA cuida do resto."
              : "Ajuste alguns detalhes rápidos para personalizar seu app."}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="relative">
              <Sparkles className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canContinue) setStep(2);
                }}
                placeholder="Ex: um site bonito para minha loja de doces artesanais"
                className="min-h-[80px] w-full resize-none rounded-xl border border-input bg-background/60 py-3 pl-9 pr-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => useSuggestion(s)}
                  className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="gradient" size="lg" onClick={() => setStep(2)} disabled={!canContinue}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="h-4 w-4 text-primary" /> Quem vai usar/ver esse site?
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: clientes locais, amigos, empresas, fãs de música..."
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Palette className="h-4 w-4 text-primary" /> Qual visual você quer transmitir?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors",
                      style === s.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Target className="h-4 w-4 text-primary" /> Qual o objetivo principal?
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PURPOSE_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPurpose(p.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                      purpose === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="lg" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button variant="gradient" size="lg" onClick={create} disabled={!canCreate || loading}>
                {loading ? "Criando..." : "Criar meu app"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
