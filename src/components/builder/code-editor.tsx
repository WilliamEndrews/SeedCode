"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Save, Loader2, X, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/lib/types";

// CodeMirror é carregado dinamicamente para evitar SSR.
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

export interface CodeEditorProps {
  files: ProjectFile[];
  selectedPath: string | null;
  onChangeSelectedPath: (path: string | null) => void;
  onSave: (path: string, content: string) => Promise<void>;
  saving: boolean;
}

export function CodeEditor({
  files,
  selectedPath,
  onChangeSelectedPath,
  onSave,
  saving,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const [openPaths, setOpenPaths] = React.useState<string[]>([]);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [extensions, setExtensions] = React.useState<Record<string, unknown>>({});

  // Carrega extensões de linguagem sob demanda.
  React.useEffect(() => {
    let cancelled = false;
    async function loadLang() {
      const byPath: Record<string, unknown> = {};
      for (const file of files) {
        const lang = langExtensionFor(file.path);
        if (lang) {
          try {
            const mod = await lang.loader();
            if (!cancelled) byPath[file.path] = (mod as any)[lang.export]();
          } catch {
            // Se a linguagem falhar ao carregar, continua sem highlight.
          }
        }
      }
      if (!cancelled) setExtensions(byPath);
    }
    loadLang();
    return () => {
      cancelled = true;
    };
  }, [files]);

  // Sincroniza os drafts quando os arquivos mudam (ex.: IA gerou código).
  React.useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const file of files) {
        next[file.path] = prev[file.path] ?? file.content;
      }
      return next;
    });
  }, [files]);

  // Abre uma aba quando a seleção muda.
  React.useEffect(() => {
    if (!selectedPath) return;
    setOpenPaths((prev) =>
      prev.includes(selectedPath) ? prev : [...prev, selectedPath]
    );
  }, [selectedPath]);

  const activePath = selectedPath ?? openPaths[openPaths.length - 1] ?? null;
  const activeContent = activePath ? drafts[activePath] ?? "" : "";

  function updateDraft(path: string, value: string) {
    setDrafts((prev) => ({ ...prev, [path]: value }));
  }

  function closeTab(path: string) {
    setOpenPaths((prev) => prev.filter((p) => p !== path));
    if (activePath === path) {
      const remaining = openPaths.filter((p) => p !== path);
      onChangeSelectedPath(remaining[remaining.length - 1] ?? null);
    }
  }

  async function handleSave(path: string) {
    const content = drafts[path];
    if (content === undefined) return;
    await onSave(path, content);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {openPaths.length > 0 && (
        <div className="flex shrink-0 items-center border-b border-border/60 bg-secondary/30">
          {openPaths.map((path) => {
            const file = files.find((f) => f.path === path);
            const isActive = path === activePath;
            const isDirty = file ? drafts[path] !== file.content : false;
            return (
              <button
                key={path}
                onClick={() => onChangeSelectedPath(path)}
                className={cn(
                  "group flex max-w-[180px] items-center gap-1.5 border-r border-border/60 px-3 py-2 text-xs",
                  isActive
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                )}
              >
                <FileCode2 className="h-3 w-3 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{path}</span>
                {isDirty && (
                  <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(path);
                  }}
                  className="ml-1 rounded p-0.5 opacity-0 hover:bg-secondary group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-border/60 px-2 py-1.5">
        <span className="truncate text-xs text-muted-foreground">
          {activePath ?? "Nenhum arquivo aberto"}
        </span>
        <button
          onClick={() => activePath && handleSave(activePath)}
          disabled={saving || !activePath}
          className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Salvar
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {activePath ? (
          <CodeMirror
            value={activeContent}
            height="100%"
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            extensions={activePath && extensions[activePath] ? [extensions[activePath] as any] : []}
            onChange={(value) => updateDraft(activePath, value)}
            className="h-full w-full text-sm"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: false,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Selecione um arquivo para editar.
          </div>
        )}
      </div>
    </div>
  );
}

function langExtensionFor(
  path: string
): { loader: () => Promise<unknown>; export: string } | null {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return { loader: () => import("@codemirror/lang-javascript"), export: "javascript" };
    case "html":
    case "htm":
      return { loader: () => import("@codemirror/lang-html"), export: "html" };
    case "css":
      return { loader: () => import("@codemirror/lang-css"), export: "css" };
    case "json":
      return { loader: () => import("@codemirror/lang-json"), export: "json" };
    case "md":
    case "markdown":
      return { loader: () => import("@codemirror/lang-markdown"), export: "markdown" };
    default:
      return null;
  }
}
