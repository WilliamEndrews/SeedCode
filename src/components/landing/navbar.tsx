"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Recursos
          </a>
          <a href="#compare" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Comparativo
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Preços
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="gradient" size="sm" asChild>
            <Link href="/signup">Começar grátis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
