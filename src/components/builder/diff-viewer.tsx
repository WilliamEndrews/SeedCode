"use client";

import * as React from "react";
import { X } from "lucide-react";
import { computeLineDiff, type DiffPart } from "@/lib/diff";

interface DiffViewerProps {
  before: string;
  after: string;
  filename: string;
  onClose?: () => void;
}

export function DiffViewer({ before, after, filename, onClose }: DiffViewerProps) {
  const parts = React.useMemo(() => computeLineDiff(before, after), [before, after]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="text-xs font-medium text-foreground">Diff: {filename}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-0 font-mono text-xs">
        <table className="w-full border-collapse">
          <tbody>
            {parts.map((part, i) => (
              <DiffRow key={i} part={part} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffRow({ part }: { part: DiffPart }) {
  const lines = part.value.split("\n").filter((_, i, arr) => i < arr.length - 1 || arr[i] !== "");
  if (lines.length === 0 && part.value === "") return null;

  const bg =
    part.type === "insert"
      ? "bg-emerald-500/10"
      : part.type === "delete"
      ? "bg-red-500/10"
      : "bg-transparent";

  const sign =
    part.type === "insert" ? "+" : part.type === "delete" ? "-" : " ";

  const color =
    part.type === "insert"
      ? "text-emerald-600 dark:text-emerald-400"
      : part.type === "delete"
      ? "text-red-600 dark:text-red-400"
      : "text-foreground";

  return (
    <>
      {lines.map((line, idx) => (
        <tr key={idx} className={bg}>
          <td className="w-8 select-none border-r border-border/40 py-0.5 pr-2 text-right text-[10px] tabular-nums text-muted-foreground">
            {part.type === "delete" ? "" : part.lineNumber + idx}
          </td>
          <td className="w-4 select-none border-r border-border/40 py-0.5 pl-1 text-center text-[10px] text-muted-foreground">
            {sign}
          </td>
          <td className={`whitespace-pre px-2 py-0.5 ${color}`}>{line || " "}</td>
        </tr>
      ))}
    </>
  );
}
