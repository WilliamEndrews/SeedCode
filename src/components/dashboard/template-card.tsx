"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Rocket,
  ShoppingBag,
  Bot,
  BarChart3,
  PenLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Template } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Rocket,
  ShoppingBag,
  Bot,
  BarChart3,
  PenLine,
  Sparkles,
};

export function TemplateCard({ template, index }: { template: Template; index: number }) {
  const router = useRouter();
  const Icon = ICONS[template.icon] ?? Sparkles;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => router.push("/builder/new")}
      className="group flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", template.gradient)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{template.name}</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {template.category}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{template.description}</p>
      </div>
    </motion.button>
  );
}
