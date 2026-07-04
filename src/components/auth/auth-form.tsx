"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { AlertCircle, Github, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { registerUser } from "@/lib/actions/auth-actions";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";

  // Estado controlado dos campos do formulário.
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Controle de carregamento e mensagem de erro exibida ao usuário.
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Submissão por e-mail/senha. No cadastro, cria a conta antes de logar.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Fluxo de cadastro: registra o usuário via Server Action.
    if (isSignup) {
      const result = await registerUser({ name, email, password });
      if (!result.success) {
        setError(result.error ?? "Não foi possível criar a conta.");
        setLoading(false);
        return;
      }
    }

    // Autentica com o provider de credenciais (sem redirect automático para
    // podermos tratar o erro na própria tela).
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    // Sucesso: navega ao dashboard.
    router.push("/dashboard");
    router.refresh();
  }

  // Login social (Google/GitHub) — redireciona diretamente ao dashboard.
  function handleOAuth(provider: "google" | "github") {
    signIn(provider, { callbackUrl: "/dashboard" });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignup ? "Crie sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignup
                ? "Comece a construir apps com IA em segundos."
                : "Entre para continuar construindo."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" onClick={() => handleOAuth("github")}>
              <Github className="h-4 w-4" /> GitHub
            </Button>
            <Button variant="outline" type="button" onClick={() => handleOAuth("google")}>
              <Mail className="h-4 w-4" /> Google
            </Button>
          </div>

          {/* Mensagem de erro de autenticação/cadastro */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">ou continue com e-mail</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Já tem uma conta? " : "Ainda não tem conta? "}
            <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-primary hover:underline">
              {isSignup ? "Entrar" : "Cadastre-se"}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
