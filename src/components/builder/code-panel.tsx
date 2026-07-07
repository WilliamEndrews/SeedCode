"use client";

import * as React from "react";
import { FileCode2, Palette, Type, Box } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function CodePanel({ projectName }: { projectName: string }) {
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
          <EmptyCode projectName={projectName} />
        </TabsContent>

        <TabsContent value="visual" className="min-h-0 flex-1 overflow-y-auto p-4">
          <VisualEdits />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Estado vazio da aba Código enquanto o app ainda não foi gerado. A geração
// real de código será implementada em fase futura.
function EmptyCode({ projectName }: { projectName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <FileCode2 className="h-6 w-6" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">
        Nenhum código gerado ainda para <span className="font-medium text-foreground">{projectName}</span>.
        Converse com a IA no chat para gerar os arquivos do projeto.
      </p>
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
