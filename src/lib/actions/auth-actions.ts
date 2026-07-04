"use server";

// =============================================================================
// Server Actions de autenticação
// -----------------------------------------------------------------------------
// Executam no servidor. Aqui fica o cadastro de novos usuários por credenciais.
// O login em si é feito no cliente via `signIn` (next-auth/react).
// =============================================================================

import { z } from "zod";
import { createUser } from "@/server/store";

// Schema de validação do formulário de cadastro.
const registerSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

// Resultado padronizado retornado ao formulário.
export interface RegisterResult {
  success: boolean;
  error?: string;
}

// Cria uma nova conta por e-mail/senha. Retorna erro amigável em caso de falha
// (validação ou e-mail já cadastrado).
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createUser(parsed.data);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar conta.";
    return { success: false, error: message };
  }
}
