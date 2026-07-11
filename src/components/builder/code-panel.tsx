"use client";

import * as React from "react";
import { FileCode2, Palette, Type, Box, Plus, Save, Loader2, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { emitFilesChanged, FILES_CHANGED_EVENT } from "@/lib/builder-events";
import { toast } from "@/store/toast-store";
import type { ProjectFile } from "@/lib/types";

export function CodePanel({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="code" className="flex h-full flex-col">
        <div className="border-b border-border/60 px-3 py-2">
          <TabsList>
            <TabsTrigger value="code">
              <FileCode2 className="h-3.5 w-3.5" /> Código
            </TabsTrigger>
            <TabsTrigger value="visual">
              <Palette className="h-3.5 w-3.5" /> Visual Edits
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="code" className="flex min-h-0 flex-1 overflow-hidden">
          <FileExplorer projectId={projectId} projectName={projectName} />
        </TabsContent>

        <TabsContent value="visual" className="min-h-0 flex-1 overflow-y-auto p-4">
          <VisualEdits />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Explorador de arquivos do projeto: lista os arquivos (ProjectFile) e permite
// editar/salvar o conteúdo. Ao salvar, dispara o evento que recarrega o preview.
function FileExplorer({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [files, setFiles] = React.useState<ProjectFile[]>([]);
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadFiles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { files: ProjectFile[] };
        setFiles(data.files);
        // Mantém a seleção atual ou seleciona o primeiro arquivo.
        setSelectedPath((prev) => prev ?? data.files[0]?.path ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadFiles();

    // Recarrega a lista quando os arquivos mudam (ex.: IA gerou código).
    function onFilesChanged(event: Event) {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      if (!detail?.projectId || detail.projectId === projectId) {
        loadFiles();
      }
    }
    window.addEventListener(FILES_CHANGED_EVENT, onFilesChanged);
    return () => window.removeEventListener(FILES_CHANGED_EVENT, onFilesChanged);
  }, [loadFiles, projectId]);

  // Sincroniza o rascunho do editor quando muda o arquivo selecionado.
  React.useEffect(() => {
    const file = files.find((f) => f.path === selectedPath);
    setDraft(file?.content ?? "");
  }, [selectedPath, files]);

  async function handleSave() {
    if (!selectedPath) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedPath, content: draft }),
      });
      if (res.ok) {
        await loadFiles();
        emitFilesChanged(projectId);
        toast.success(`"${selectedPath}" salvo.`);
      } else {
        toast.error(`Falha ao salvar "${selectedPath}".`);
      }
    } catch {
      toast.error("Erro de conexão ao salvar o arquivo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(path: string) {
    if (!window.confirm(`Excluir "${path}"?`)) return;
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(`/api/projects/${projectId}/files/${encoded}`, {
      method: "DELETE",
    });
    if (res.ok) {
      // Se o arquivo aberto foi removido, limpa a seleção.
      setSelectedPath((prev) => (prev === path ? null : prev));
      await loadFiles();
      emitFilesChanged(projectId);
      toast.success(`"${path}" excluído.`);
    } else {
      toast.error(`Falha ao excluir "${path}".`);
    }
  }

  async function handleNewFile() {
    const path = window.prompt("Nome do arquivo (ex.: index.html)");
    if (!path) return;
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content: "" }),
    });
    if (res.ok) {
      await loadFiles();
      setSelectedPath(path);
      emitFilesChanged(projectId);
      toast.success(`"${path}" criado.`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? `Falha ao criar "${path}".`);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileCode2 className="h-6 w-6" />
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Nenhum código gerado ainda para{" "}
          <span className="font-medium text-foreground">{projectName}</span>.
          Converse com a IA no chat ou crie um arquivo manualmente.
        </p>
        <button
          onClick={handleNewFile}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Novo arquivo
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Árvore de arquivos */}
      <div className="flex w-40 flex-col border-r border-border/60">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[11px] font-medium uppercase text-muted-foreground">
            Arquivos
          </span>
          <button
            onClick={handleNewFile}
            title="Novo arquivo"
            className="rounded p-1 text-muted-foreground hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "group flex w-full items-center gap-1.5 px-2 py-1.5 text-xs",
                selectedPath === file.path
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              <button
                onClick={() => setSelectedPath(file.path)}
                className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left"
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
              <button
                onClick={() => handleDelete(file.path)}
                title="Excluir arquivo"
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor do arquivo selecionado */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-2 py-1.5">
          <span className="truncate text-xs text-muted-foreground">
            {selectedPath}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
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
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-background p-3 font-mono text-xs leading-relaxed text-foreground outline-none"
          placeholder="Conteúdo do arquivo..."
        />
      </div>
    </div>
  );
}

function VisualEdits() {
  const [color, setColor] = React.useState("#10b981");
  const [fontSize, setFontSize] = React.useState(24);
  const [radius, setRadius] = React.useState(12);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Selecione um elemento no preview. Mudanças viram diffs commitáveis.
      </p>

      <Field icon={Type} label="Tamanho da fonte">
        <input
          type="range"
          min={12}
          max={48}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <span className="w-10 text-right text-xs tabular-nums">{fontSize}px</span>
      </Field>

      <Field icon={Palette} label="Cor primária">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="text-xs uppercase">{color}</span>
      </Field>

      <Field icon={Box} label="Border radius">
        <input
          type="range"
          min={0}
          max={32}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <span className="w-10 text-right text-xs tabular-nums">{radius}px</span>
      </Field>

      <div className="rounded-lg border bg-secondary/40 p-4">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">Preview do estilo</div>
        <button
          style={{ backgroundColor: color, fontSize: `${fontSize / 2}px`, borderRadius: `${radius}px` }}
          className="px-4 py-2 font-medium text-white"
        >
          Botão de exemplo
        </button>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: typeof Type; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
