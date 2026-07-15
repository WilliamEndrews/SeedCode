"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Share2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/store/toast-store";

interface Member {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: "owner" | "editor" | "viewer";
}

export function ShareDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) throw new Error("Falha ao carregar membros.");
      const data = (await res.json()) as { members: Member[] };
      setMembers(data.members);
    } catch {
      toast.error("Erro ao carregar membros.");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error || "Falha ao adicionar membro.");
        return;
      }
      setEmail("");
      toast.success("Membro adicionado!");
      await loadMembers();
    } catch {
      toast.error("Erro de conexão ao adicionar membro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Membro removido.");
      await loadMembers();
    } catch {
      toast.error("Falha ao remover membro.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) loadMembers(); }}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Compartilhar projeto</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleAdd} className="mb-6 space-y-3">
            <div>
              <Label htmlFor="member-email">E-mail do colaborador</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="dev@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="member-role">Papel</Label>
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={loading}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Visualizador</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              Adicionar membro
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Membros</h4>
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum membro adicionado.</p>
            )}
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between rounded-md border p-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(m.userId)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
