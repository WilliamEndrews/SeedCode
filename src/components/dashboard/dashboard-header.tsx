"use client";

import Link from "next/link";
import { Bell, Search, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-6">
        <Link href="/dashboard">
          <Logo />
        </Link>

        <div className="relative ml-4 hidden max-w-sm flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." className="pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="gradient" size="sm" asChild>
            <Link href="/builder/new">
              <Plus className="h-4 w-4" /> Novo app
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    SC
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Faturamento</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">Sair</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
