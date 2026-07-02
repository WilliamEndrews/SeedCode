"use client";

import * as React from "react";
import { FileCode2, Folder, FileText, Palette, Type, Box } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const FILE_TREE = [
  { name: "src", type: "folder", depth: 0 },
  { name: "app", type: "folder", depth: 1 },
  { name: "page.tsx", type: "file", depth: 2, active: true },
  { name: "layout.tsx", type: "file", depth: 2 },
  { name: "components", type: "folder", depth: 1 },
  { name: "Board.tsx", type: "file", depth: 2 },
  { name: "Card.tsx", type: "file", depth: 2 },
  { name: "lib", type: "folder", depth: 1 },
  { name: "db.ts", type: "file", depth: 2 },
];

const CODE = `export default function Page() {
  const [columns] = useState(INITIAL_COLUMNS);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">
        Meus Quadros
      </h1>
      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <Column key={col.id} data={col} />
        ))}
      </div>
    </main>
  );
}`;

export function CodePanel() {
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

        <TabsContent value="code" className="flex flex-1 overflow-hidden">
          <div className="w-44 shrink-0 overflow-y-auto border-r border-border/60 py-2">
            {FILE_TREE.map((f, i) => (
              <button
                key={i}
                className={cn(
                  "flex w-full items-center gap-1.5 px-3 py-1 text-xs transition-colors hover:bg-secondary",
                  f.active && "bg-primary/10 text-primary"
                )}
                style={{ paddingLeft: `${f.depth * 12 + 12}px` }}
              >
                {f.type === "folder" ? (
                  <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {f.name}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto bg-[#0d0d10] p-4">
            <pre className="font-mono text-xs leading-relaxed text-zinc-300">
              <code>{CODE}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="visual" className="flex-1 overflow-y-auto p-4">
          <VisualEdits />
        </TabsContent>
      </Tabs>
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
