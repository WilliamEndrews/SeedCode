# SeedCode — Análise de Estado Atual & Rota para o Agente 2

> **Autor:** Agente 1 — Pesquisador + Arquiteto de Software Sênior
> **Data:** Julho 2026
> **Objetivo:** Dividir o desenvolvimento em duas etapas executáveis para o Agente 2, com tarefas técnicas, arquivos a alterar e critérios de pronto.

---

## 0. Resumo Executivo

O SeedCode já tem **autenticação real, API de projetos, chat com streaming e multi-LLM com fallback**. O próximo grande passo é transformar o chat em um **construtor real**: o usuário pede algo em linguagem natural e o app aparece no preview e no editor.

Para isso, dividimos em **duas etapas sequenciais**:

1. **Etapa 1 — Fundação Real**: banco de dados persistente + sistema de arquivos virtual + sandbox + preview real.
2. **Etapa 2 — Agente Construtor**: o chat interpreta a resposta da IA, gera arquivos, roda no sandbox, corrige erros e permite aprovação de planos.

---

## 1. Etapa 1 — Fundação Real

> **Sem isso o produto não constrói nada.**

**Objetivo técnico:** substituir o store em memória por Prisma/PostgreSQL, criar o sistema de arquivos de projeto, plugar um sandbox e fazer o preview exibir o app real.

---

### 1.1 Tarefas técnicas

#### 1.1.1 Adicionar Prisma e PostgreSQL

- **Pacotes:** `prisma`, `@prisma/client`
- **Arquivos a criar:**
  - `prisma/schema.prisma` — schema inicial
  - `prisma/migrations/` — pasta de migrações
- **Arquivos a alterar:**
  - `package.json` — adicionar dependências
  - `.env.local` — adicionar `DATABASE_URL`
  - `src/server/store.ts` — substituir funções por queries Prisma
  - `src/auth.ts` — usar `PrismaAdapter`
  - `src/auth.config.ts` — ajustar se necessário para compatibilidade com o adapter
- **Schema mínimo (inicial):**
  ```prisma
  model User {
    id            String    @id @default(cuid())
    email         String    @unique
    name          String?
    password      String?          // para credenciais
    emailVerified DateTime?
    image         String?
    accounts      Account[]
    sessions      Session[]
    projects      Project[]
    createdAt     DateTime  @default(now())
  }

  model Account {
    id                String  @id @default(cuid())
    userId            String
    type              String
    provider          String
    providerAccountId String
    refresh_token     String? @db.Text
    access_token      String? @db.Text
    expires_at        Int?
    token_type        String?
    scope             String?
    id_token          String? @db.Text
    session_state     String?
    user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  model Session {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  model Project {
    id            String        @id @default(cuid())
    name          String
    description   String?
    status        String        @default("draft")
    framework     String        @default("Next.js")
    llm           String        @default("llama-3.3-70b-versatile")
    thumbnailGradient String    @default("from-emerald-500 to-teal-600")
    ownerId       String
    owner         User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
    files         ProjectFile[]
    createdAt     DateTime      @default(now())
    updatedAt     DateTime      @updatedAt
  }
  ```
- **Comandos:**
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

#### 1.1.2 Criar sistema de arquivos virtual (ProjectFile)

- **Arquivos a criar:**
  - `prisma/schema.prisma` — adicionar model `ProjectFile`
  - `src/server/project-files.ts` — funções CRUD de arquivos
- **Schema `ProjectFile`:**
  ```prisma
  model ProjectFile {
    id        String   @id @default(cuid())
    projectId String
    path      String
    content   String   @db.Text
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
    @@unique([projectId, path])
  }
  ```
- **Funções mínimas em `src/server/project-files.ts`:**
  - `listFiles(projectId: string): Promise<ProjectFile[]>`
  - `getFile(projectId: string, path: string): Promise<ProjectFile | null>`
  - `writeFile(projectId: string, path: string, content: string): Promise<ProjectFile>`
  - `deleteFile(projectId: string, path: string): Promise<void>`
- **Arquivos a alterar:**
  - `src/app/api/projects/[id]/route.ts` — adicionar `GET /api/projects/[id]/files` (delegado ou nova rota)
  - Criar `src/app/api/projects/[id]/files/route.ts` com `GET` (listar) e `POST` (escrever)
  - Criar `src/app/api/projects/[id]/files/[path]/route.ts` com `GET` (ler) e `DELETE` (remover) — o path pode vir codificado ou como body

#### 1.1.3 Integrar sandbox

> **Recomendação:** começar com **iframe + apps HTML estáticos** como MVP. É a forma mais rápida de ter um preview real sem depender de bibliotecas pesadas. Depois evolui para WebContainers ou E2B.

- **Arquivos a criar:**
  - `src/server/sandbox/html-sandbox.ts` — monta `index.html` a partir de `ProjectFile[]` e retorna um Blob URL ou HTML string
- **Arquivos a alterar:**
  - `src/components/builder/preview-pane.tsx` — receber `projectId` e buscar `files` via API; renderizar iframe com conteúdo do sandbox
- **Fluxo mínimo:**
  1. `PreviewPane` recebe `projectId`
  2. Carrega `ProjectFile[]` de `/api/projects/[id]/files`
  3. Se existir `index.html`, injeta no `iframe` via `srcDoc`
  4. Se não existir, exibe `EmptyPreview` (já implementado)

#### 1.1.4 Exibir arquivos no CodePanel

- **Arquivos a alterar:**
  - `src/components/builder/code-panel.tsx` — substituir `EmptyCode` por árvore de arquivos quando existirem `ProjectFile`
  - Criar `src/components/builder/file-tree.tsx` — lista de arquivos clicáveis
  - Criar `src/components/builder/file-editor.tsx` — editor simples (textarea com syntax highlight via Shiki ou Prism) para exibir/conteúdo do arquivo selecionado

#### 1.1.5 Manter compatibilidade com APIs existentes

- **Contrato da API de projetos não pode mudar** (já validado com curl).
- Apenas a implementação interna das funções em `src/server/store.ts` muda de memória para Prisma.

---

### 1.2 Arquivos que serão tocados (resumo)

```
prisma/
  schema.prisma (novo)
  migrations/   (novo)

src/
  server/
    store.ts              (reescrito para Prisma)
    project-files.ts      (novo)
    sandbox/
      html-sandbox.ts     (novo)
  app/
    api/
      projects/[id]/
        files/
          route.ts        (novo)
        files/[path]/
          route.ts        (novo)
  components/
    builder/
      preview-pane.tsx    (conectar ao sandbox)
      code-panel.tsx      (exibir arquivos)
      file-tree.tsx       (novo)
      file-editor.tsx     (novo)
  auth.ts                 (PrismaAdapter)
  package.json
  .env.local
```

---

### 1.3 Critérios de pronto (Definition of Done)

- [ ] `npm run build` passa sem erros
- [ ] `npx prisma migrate dev` cria o banco corretamente
- [ ] Dados de usuários e projetos persistem após reiniciar o servidor
- [ ] API REST de projetos continua respondendo 200 nos mesmos endpoints
- [ ] `POST /api/projects/[id]/files` cria um arquivo no banco
- [ ] `GET /api/projects/[id]/files` lista os arquivos
- [ ] `PreviewPane` exibe um `index.html` salvo via iframe
- [ ] `CodePanel` lista arquivos e exibe o conteúdo do selecionado
- [ ] Teste manual: cadastrar usuário, criar projeto, salvar `index.html`, recarregar a página e o arquivo continua lá

---

## 2. Etapa 2 — Agente Construtor

> **Aqui o chat vira um builder real.**

**Objetivo técnico:** ao enviar uma mensagem no chat, o agente interpreta a resposta, cria/atualiza arquivos, roda o sandbox, mostra o preview e trata erros de build.

---

### 2.1 Tarefas técnicas

#### 2.1.1 Reescrever o fluxo de chat para construção

- **Arquivo principal:** `src/store/chat-store.ts` (`sendMessage`)
- **Alteração:** ao invés de apenas exibir a resposta em texto, após o stream terminar, extrair blocos de código e aplicá-los como `ProjectFile`.
- **Estratégia de parsing:**
  - Procurar blocos Markdown tipo ` ```tsx filepath="src/components/button.tsx" ... ``` `
  - Se não houver path, assumir `index.html` para blocos HTML, `index.tsx` para React, etc.
  - Fallback: se a resposta for pura explicação, apenas exibir no chat (comportamento atual)

#### 2.1.2 Adicionar tool calls ao gateway de chat

- **Arquivo principal:** `src/server/llm/gateway.ts`
- **Alterações:**
  - Aceitar array de `tools` no `streamChat`
  - Definir tool schema para:
    - `write_file`: `{ path: string, content: string }`
    - `read_file`: `{ path: string }`
    - `run_terminal`: `{ command: string }`
  - Retornar, junto com o stream, instruções de tool calls para o orquestrador
- **Observação:** AI SDK v4 suporta tool calls nativamente com `streamText` e `tools`. Verificar se `result.fullStream` emite partes do tipo `tool-call` e `tool-result`.

#### 2.1.3 Criar orquestrador de agente

- **Arquivo novo:** `src/server/agent/orchestrator.ts`
- **Responsabilidades:**
  1. Receber mensagem do usuário + contexto do projeto
  2. Chamar `streamChat` com tools
  3. Interpretar a resposta:
     - Se houver `tool_call` → executar a ferramenta (escrever/ler arquivo, rodar comando)
     - Se houver texto explicativo → adicionar ao chat
  4. Em loop: após executar tool, enviar o resultado de volta para a IA (`tool_result`) e continuar até a resposta finalizar
- **Funções de ferramenta:**
  - `executeWriteFile(projectId, path, content)` → salva via `src/server/project-files.ts`
  - `executeReadFile(projectId, path)` → lê do banco
  - `executeTerminal(projectId, command)` → futuramente no E2B/WebContainers; no MVP apenas simular para HTML estático

#### 2.1.4 Implementar Plan Mode real

- **Arquivo principal:** `src/store/chat-store.ts` (`mode`, `approvePlanStep`)
- **Fluxo:**
  1. Quando `mode === "plan"`, a IA recebe system prompt que a força a retornar um plano numerado, não código
  2. O plano é exibido no chat com botões "Aprovar e executar" por etapa
  3. Ao aprovar, o orquestrador executa a etapa como se estivesse em `mode === "agent"`
  4. Cada etapa executada vira um checkpoint
- **Arquivo novo:** `src/components/builder/plan-steps.tsx` — renderiza passos do plano com botões de aprovação

#### 2.1.5 Checkpoints reversíveis

- **Schema Prisma:** adicionar model `Checkpoint` em `prisma/schema.prisma`
  ```prisma
  model Checkpoint {
    id        String   @id @default(cuid())
    projectId String
    label     String
    files     Json     // snapshot de ProjectFile[]
    createdAt DateTime @default(now())
  }
  ```
- **Arquivo novo:** `src/server/checkpoints.ts` — `createCheckpoint(projectId, label)`, `restoreCheckpoint(checkpointId)`
- **UI:** adicionar lista de checkpoints no `CodePanel` ou em nova aba "History"

#### 2.1.6 Loop de correção de build

- **Arquivo principal:** `src/server/agent/orchestrator.ts`
- **Fluxo:**
  1. Após escrever arquivos, executar "build" no sandbox (no MVP, apenas validar HTML)
  2. Se houver erro, enviar o erro de volta para a IA como mensagem de sistema
  3. A IA retorna correção → aplicar → repetir até 3 tentativas
  4. Se falhar após 3 tentativas, exibir erro no chat e oferecer opção manual

#### 2.1.7 Conectar Preview ao estado final

- **Arquivo:** `src/components/builder/preview-pane.tsx`
- **Alteração:** após o orquestrador salvar arquivos, disparar re-fetch dos arquivos e atualizar o `iframe` automaticamente
- Pode ser feito via evento do Zustand ou via `useEffect` reagindo a mudanças de `ProjectFile[]`

---

### 2.2 Arquivos que serão tocados (resumo)

```
src/
  store/
    chat-store.ts              (reescrever sendMessage)
  server/
    llm/
      gateway.ts               (adicionar tool calls)
    agent/
      orchestrator.ts          (novo — core do agente)
      tools.ts                 (novo — implementações das tools)
    checkpoints.ts             (novo)
  app/
    api/
      chat/
        route.ts               (chamar orquestrador em vez de gateway direto)
  components/
    builder/
      plan-steps.tsx           (novo)
      code-panel.tsx           (aba History/Checkpoints)
      preview-pane.tsx         (re-fetch automático)
```

---

### 2.3 Critérios de pronto (Definition of Done)

- [ ] `npm run build` passa sem erros
- [ ] Enviar "crie um botão azul com Tailwind" gera um arquivo `index.html` e o preview exibe o botão
- [ ] O badge do modelo continua aparecendo nas mensagens
- [ ] Plan Mode gera um plano numerado e só executa após aprovação do usuário
- [ ] Cada execução de plano cria um checkpoint acessível na UI
- [ ] Checkpoints permitem restaurar o estado anterior dos arquivos
- [ ] Erros de build são reportados no chat e a IA tenta corrigir automaticamente (até 3x)
- [ ] O chat continua funcionando com streaming e fallback

---

## 3. Contexto: Por que essa ordem?

A **Etapa 1** é infraestrutura. Sem banco de dados persistente, o agente perde tudo ao reiniciar. Sem sandbox, o preview não existe. Sem `ProjectFile`, não há o que o agente possa escrever.

A **Etapa 2** é inteligência. Só faz sentido ensinar o agente a construir depois que existe um local seguro (banco) e uma ferramenta (sandbox) para materializar o código.

Tentar fazer a Etapa 2 antes da Etapa 1 resulta em um "builder fake" que perde o trabalho a cada restart — exatamente o problema que o SeedCode deve evitar.

---

## 4. Anexo A — Estado Atual vs. Concorrentes (resumo)

| Funcionalidade | Lovable.dev | Base44.com | SeedCode HOJE | Gap a fechar |
|---|---|---|---|---|
| Auth + Dashboard | ✅ | ✅ | ✅ | — |
| Chat streaming | ✅ | ✅ | ✅ | — |
| Multi-LLM fallback | ❌ | ❌ | ✅ | Diferencial mantido |
| Preview ao vivo | ✅ | ✅ | ❌ | Etapa 1 |
| Geração real de código | ✅ | ✅ | ❌ | Etapa 2 |
| Sandbox | ✅ | ✅ | ❌ | Etapa 1 |
| Banco persistente | ✅ | ✅ | ❌ | Etapa 1 |
| Plan Mode com aprovação | ✅ | ❌ | ❌ | Etapa 2 |
| Checkpoints | ✅ | ❌ | ❌ | Etapa 2 |
| Visual Edits | ✅ | ❌ | ❌ | Futuro |
| GitHub/Deploy | ✅ | Parcial | ❌ | Futuro |

---

## 5. Anexo B — Débitos Técnicos Atuais

| Débito | Arquivo | Impacto | Resolvido em |
|---|---|---|---|
| Store em memória perde dados no restart | `src/server/store.ts` | 🔴 Bloqueante | Etapa 1 |
| Preview/CodePanel com empty state | `preview-pane.tsx`, `code-panel.tsx` | 🔴 Core ausente | Etapa 1 |
| Modos Plan/Visual/Auto sem lógica real | `src/store/chat-store.ts` | 🟡 UI enganosa | Etapa 2 |
| Sem testes automatizados | — | 🟡 Risco de regressão | Futuro |
| Google API key com formato inválido (`AQ.`) | `.env.local` | 🟡 Gemini não funciona | Configuração do usuário |

---

## 6. Anexo C — Variáveis de Ambiente

```env
# Já existentes
AUTH_SECRET="..."
GROQ_API_KEY="..."
GOOGLE_GENERATIVE_AI_API_KEY="..."

# Etapa 1
DATABASE_URL="postgresql://..."          # Supabase/Railway/Neon

# Futuro
E2B_API_KEY="..."                        # sandbox cloud (opcional)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
VERCEL_TOKEN="..."
VERCEL_TEAM_ID="..."
```

---

> **Para o Agente 2:** inicie pela **Etapa 1**. Só depois de ela estar 100% concluída e testada, avance para a **Etapa 2**. A cada sub-tarefa, rode `npm run build` para garantir que nada quebrou.
