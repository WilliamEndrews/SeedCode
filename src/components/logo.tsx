import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
        <Sprout className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          Seed<span className="text-primary">Code</span>
        </span>
      )}
    </div>
  );
}
