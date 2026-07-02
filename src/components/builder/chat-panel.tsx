"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Check, CircleDashed, Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { useChatStore } from "@/store/chat-store";
import { ModeSwitcher } from "./mode-switcher";
import { LLMSelector } from "./llm-selector";
import { CostPanel } from "./cost-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  function submit() {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Agente SeedCode
        </div>
        <LLMSelector />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Pensando...
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-3">
        <ModeSwitcher />
        <div className="relative mt-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Peça uma mudança ou descreva uma feature..."
            rows={2}
            className="w-full resize-none rounded-xl border border-input bg-background py-3 pl-4 pr-12 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="icon"
            variant="gradient"
            onClick={submit}
            disabled={!input.trim()}
            className="absolute bottom-2.5 right-2.5 h-8 w-8"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CostPanel />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const approvePlanStep = useChatStore((s) => s.approvePlanStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.plan && (
          <div className="mt-3 space-y-2">
            {message.plan.map((step) => (
              <div key={step.id} className="flex items-start gap-2 rounded-lg bg-background/60 p-2">
                <button
                  onClick={() => approvePlanStep(message.id, step.id)}
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    step.approved ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  )}
                >
                  {step.approved && <Check className="h-3 w-3" />}
                </button>
                <div>
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.steps && (
          <div className="mt-3 space-y-1.5">
            <AnimatePresence>
              {message.steps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <StepIcon state={step.state} />
                  <span className={cn(step.state === "done" && "text-muted-foreground")}>{step.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StepIcon({ state }: { state: "pending" | "running" | "done" | "error" }) {
  if (state === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (state === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  if (state === "error") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />;
}
