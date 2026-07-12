"use client";

import * as React from "react";
import { FileCode2, Palette, Type, Box, Plus, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { emitFilesChanged, FILES_CHANGED_EVENT } from "@/lib/builder-events";
import { toast } from "@/store/toast-store";
import type { ProjectFile } from "@/lib/types";
import { FileTree } from "./file-tree";
import { CodeEditor } from "./code-editor";

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

// Explorador de arquivos do projeto: lista em árvore, edita com CodeMirror
// (syntax highlighting + tabs), e permite criar/renomear/mover/excluir arquivos.
function FileExplorer({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [files, setFiles] = React.useState<ProjectFile[]>([]);
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
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
      } else {
        toast.error("Falha ao carregar arquivos.");
      }
    } catch {
      toast.error("Erro de conexão ao carregar arquivos.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadFiles();

    function onFilesChanged(event: Event) {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      if (!detail?.projectId || detail.projectId === projectId) {
        loadFiles();
      }
    }
    window.addEventListener(FILES_CHANGED_EVENT, onFilesChanged);
    return () => window.removeEventListener(FILES_CHANGED_EVENT, onFilesChanged);
  }, [loadFiles, projectId]);

  async function handleSave(path: string, content: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      if (res.ok) {
        await loadFiles();
        emitFilesChanged(projectId);
        toast.success(`"${path}" salvo.`);
      } else {
        toast.error(`Falha ao salvar "${path}".`);
      }
    } catch {
      toast.error("Erro de conexão ao salvar o arquivo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(path: string) {
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(`/api/projects/${projectId}/files/${encoded}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (selectedPath === path) setSelectedPath(null);
      await loadFiles();
      emitFilesChanged(projectId);
      toast.success(`"${path}" excluído.`);
    } else {
      toast.error(`Falha ao excluir "${path}".`);
    }
  }

  async function handleNewFile(path: string) {
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

  async function handleNewFolder(path: string) {
    // Pastas são representadas por um arquivo .gitkeep interno, já que o modelo
    // atual não armazena pastas vazias. O usuário vê a pasta e pode criar
    // arquivos dentro dela.
    const marker = `${path}/.gitkeep`;
    await handleNewFile(marker);
  }

  async function handleRename(oldPath: string, newPath: string) {
    const file = files.find((f) => f.path === oldPath);
    if (!file) return;
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: newPath, content: file.content }),
    });
    if (res.ok) {
      await handleDelete(oldPath);
      if (selectedPath === oldPath) setSelectedPath(newPath);
      await loadFiles();
      emitFilesChanged(projectId);
      toast.success(`Renomeado para "${newPath}".`);
    } else {
      toast.error(`Falha ao renomear "${oldPath}".`);
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
          onClick={() => handleNewFile("index.html")}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Novo arquivo
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-44 flex-col border-r border-border/60">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[11px] font-medium uppercase text-muted-foreground">
            Arquivos
          </span>
          <button
            onClick={() => handleNewFile("index.html")}
            title="Novo arquivo"
            className="rounded p-1 text-muted-foreground hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <FileTree
          files={files}
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      <CodeEditor
        files={files}
        selectedPath={selectedPath}
        onChangeSelectedPath={setSelectedPath}
        onSave={handleSave}
        saving={saving}
      />
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
