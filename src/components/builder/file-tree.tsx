"use client";

import * as React from "react";
import {
  FileCode2,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/lib/types";

export type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children: TreeNode[];
};

interface FileTreeProps {
  files: ProjectFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onNewFile: (path: string) => void;
  onNewFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
}

export function FileTree({
  files,
  selectedPath,
  onSelect,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: FileTreeProps) {
  const [openFolders, setOpenFolders] = React.useState<Set<string>>(new Set());
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");

  const tree = React.useMemo(() => buildTree(files), [files]);

  function toggleFolder(path: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function startRename(node: TreeNode) {
    setEditing(node.path);
    setEditValue(node.name);
  }

  function submitRename(node: TreeNode) {
    if (!editValue.trim() || editValue.trim() === node.name) {
      setEditing(null);
      return;
    }
    const parent = node.path.slice(0, -node.name.length - 1);
    const newPath = parent ? `${parent}/${editValue.trim()}` : editValue.trim();
    if (newPath !== node.path) onRename(node.path, newPath);
    setEditing(null);
  }

  function startNewFile(parentPath: string) {
    const name = window.prompt("Nome do arquivo:");
    if (!name) return;
    const target = parentPath ? `${parentPath}/${name}` : name;
    onNewFile(target);
  }

  function startNewFolder(parentPath: string) {
    const name = window.prompt("Nome da pasta:");
    if (!name) return;
    const target = parentPath ? `${parentPath}/${name}` : name;
    onNewFolder(target);
  }

  function confirmDelete(path: string) {
    if (window.confirm(`Excluir "${path}"?`)) onDelete(path);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <TreeNodeRow
        node={{ name: "", path: "", type: "folder", children: tree }}
        depth={-1}
        selectedPath={selectedPath}
        openFolders={openFolders}
        editing={editing}
        editValue={editValue}
        onToggle={toggleFolder}
        onSelect={onSelect}
        onStartRename={startRename}
        onEditChange={setEditValue}
        onSubmitRename={submitRename}
        onCancelEdit={() => setEditing(null)}
        onNewFile={startNewFile}
        onNewFolder={startNewFolder}
        onDelete={confirmDelete}
      />
    </div>
  );
}

interface TreeNodeRowProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  openFolders: Set<string>;
  editing: string | null;
  editValue: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onStartRename: (node: TreeNode) => void;
  onEditChange: (value: string) => void;
  onSubmitRename: (node: TreeNode) => void;
  onCancelEdit: () => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onDelete: (path: string) => void;
}

function TreeNodeRow({
  node,
  depth,
  selectedPath,
  openFolders,
  editing,
  editValue,
  onToggle,
  onSelect,
  onStartRename,
  onEditChange,
  onSubmitRename,
  onCancelEdit,
  onNewFile,
  onNewFolder,
  onDelete,
}: TreeNodeRowProps) {
  const isOpen = openFolders.has(node.path);
  const isSelected = node.type === "file" && node.path === selectedPath;
  const isEditing = editing === node.path;

  if (depth >= 0) {
    return (
      <div className="select-none">
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1 text-xs",
            isSelected
              ? "bg-secondary font-medium text-foreground"
              : "text-muted-foreground hover:bg-secondary/60",
            isEditing && "bg-secondary/60"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === "folder" ? (
            <button
              onClick={() => onToggle(node.path)}
              className="shrink-0 rounded p-0.5 hover:bg-secondary"
            >
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {node.type === "folder" ? (
            isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
            )
          ) : (
            <FileCode2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}

          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitRename(node);
                if (e.key === "Escape") onCancelEdit();
              }}
              onBlur={() => onSubmitRename(node)}
              className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <button
              onClick={() =>
                node.type === "file" ? onSelect(node.path) : onToggle(node.path)
              }
              className="min-w-0 flex-1 truncate text-left"
              title={node.path}
            >
              {node.name}
            </button>
          )}

          {!isEditing && (
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
              {node.type === "folder" && (
                <>
                  <ActionButton
                    title="Novo arquivo"
                    onClick={() => onNewFile(node.path)}
                  >
                    <Plus className="h-3 w-3" />
                  </ActionButton>
                  <ActionButton
                    title="Nova pasta"
                    onClick={() => onNewFolder(node.path)}
                  >
                    <Folder className="h-3 w-3" />
                  </ActionButton>
                </>
              )}
              <ActionButton title="Renomear" onClick={() => onStartRename(node)}>
                <Edit3 className="h-3 w-3" />
              </ActionButton>
              <ActionButton
                title="Excluir"
                onClick={() => onDelete(node.path)}
                className="hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </ActionButton>
            </div>
          )}
        </div>

        {node.type === "folder" && isOpen && (
          <div>
            {node.children.map((child) => (
              <TreeNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                openFolders={openFolders}
                editing={editing}
                editValue={editValue}
                onToggle={onToggle}
                onSelect={onSelect}
                onStartRename={onStartRename}
                onEditChange={onEditChange}
                onSubmitRename={onSubmitRename}
                onCancelEdit={onCancelEdit}
                onNewFile={onNewFile}
                onNewFolder={onNewFolder}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Root: renderiza apenas os filhos, sem linha própria.
  return (
    <div>
      {node.children.map((child) => (
        <TreeNodeRow
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          openFolders={openFolders}
          editing={editing}
          editValue={editValue}
          onToggle={onToggle}
          onSelect={onSelect}
          onStartRename={onStartRename}
          onEditChange={onEditChange}
          onSubmitRename={onSubmitRename}
          onCancelEdit={onCancelEdit}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  children,
  className,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  // Ordena para garantir que pastas pai sejam criadas antes dos filhos.
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split("/");
    let currentPath = "";
    let parent: TreeNode[] = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let node = map.get(currentPath);
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: [],
        };
        map.set(currentPath, node);
        parent.push(node);
      }

      if (!isFile) {
        parent = node.children;
      }
    }
  }

  // Ordena cada nível: pastas primeiro, depois arquivos, ambos por nome.
  return sortNodes(root);
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    })
    .map((node) =>
      node.type === "folder" ? { ...node, children: sortNodes(node.children) } : node
    );
}
