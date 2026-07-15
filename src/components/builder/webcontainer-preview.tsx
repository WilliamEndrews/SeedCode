"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { ProjectFile } from "@/lib/types";
import type { FileSystemTree } from "@webcontainer/api";
import { WebContainer } from "@webcontainer/api";

// Servidor estático mínimo que roda dentro do WebContainer para servir os
// arquivos do projeto. Escutamos na porta 8080 e o WebContainer gera uma URL
// acessível para o iframe.
const SERVER_SCRIPT = `const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
};
const server = http.createServer((req, res) => {
  let filePath = '.' + (req.url || '/').split('?')[0];
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not found' : String(err));
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});
server.listen(PORT, '0.0.0.0');
`;

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return Promise.resolve(webcontainerInstance);
  if (bootPromise) return bootPromise;
  bootPromise = WebContainer.boot({ coep: "require-corp" });
  bootPromise.then((wc) => {
    webcontainerInstance = wc;
  });
  return bootPromise;
}

function buildFileTree(files: ProjectFile[]): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const file of files) {
    const parts = file.path.split("/");
    let current: FileSystemTree = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === "" || part === ".") continue;
      if (i === parts.length - 1) {
        current[part] = { file: { contents: file.content } };
      } else {
        const existing = current[part];
        if (!existing || !("directory" in existing)) {
          current[part] = { directory: {} };
        }
        current = (current[part] as { directory: FileSystemTree }).directory;
      }
    }
  }
  return tree;
}

interface WebContainerPreviewProps {
  files: ProjectFile[];
  projectName: string;
}

export function WebContainerPreview({ files, projectName }: WebContainerPreviewProps) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let process: { kill: () => void } | null = null;

    async function start() {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);
        setUrl(null);

        const webcontainer = await getWebContainer();
        if (!mounted) return;

        const tree = buildFileTree(files);
        tree["__seedcode_server.js"] = { file: { contents: SERVER_SCRIPT } };

        await webcontainer.mount(tree);
        if (!mounted) return;

        webcontainer.on("server-ready", (port, readyUrl) => {
          if (mounted) setUrl(readyUrl);
        });

        const p = await webcontainer.spawn("node", ["__seedcode_server.js"], {
          output: false,
        });
        process = p;
        if (!mounted) p.kill();
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    start();
    return () => {
      mounted = false;
      process?.kill();
    };
  }, [files]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-red-500">
        <p className="text-sm">Sandbox indisponível: {error}</p>
      </div>
    );
  }

  if (loading || !url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Iniciando sandbox real...</p>
      </div>
    );
  }

  return (
    <iframe
      title={`Preview de ${projectName}`}
      src={url}
      className="h-full w-full border-0 bg-white"
      allow="cross-origin-isolated"
    />
  );
}
