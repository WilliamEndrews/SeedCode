import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} SeedCode. Construído para superar o estado da arte.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Recursos</a>
          <a href="#compare" className="hover:text-foreground">Comparativo</a>
          <a href="#pricing" className="hover:text-foreground">Preços</a>
        </div>
      </div>
    </footer>
  );
}
