# SeedCode

> Plataforma **AI Builder** que combina e supera o melhor de **Lovable.dev** e **Base44.com**: chat inteligente, agentes autônomos, edição visual, multi-LLM, custo transparente e código 100% seu (sem lock-in).

A aplicação já conta com **backend real (Prisma + Supabase)**, **autenticação funcional**, **chat multi-LLM com geração de arquivos**, **preview sandbox** e **integrações iniciais com Vercel e GitHub**. A interface de alta fidelidade continua sendo a base do produto.

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui (Radix)**
- **Zustand** (estado) · **Framer Motion** (animações) · **Lucide** (ícones) · **next-themes** (dark mode)

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha AUTH_SECRET (npx auth secret)
npm run dev
```

Acesse `http://localhost:3000`.

**Usuário demo:** `demo@seedcode.dev` · senha `seedcode123`.

## Autenticação (NextAuth v5)

- **Credenciais** (e-mail + senha) com hash **bcrypt** — cadastro em `/signup`, login em `/login`.
- **OAuth Google/GitHub** — habilitados ao preencher as chaves `AUTH_*` no `.env.local`.
- Rotas `/dashboard` e `/builder` são protegidas pelo `middleware.ts`.

> **Nota:** usuários e projetos são persistidos em **PostgreSQL (Supabase)** via Prisma. O `src/server/store.ts` atua como camada de acesso a dados.

## Multi-LLM (Fase 2B)

Gateway com **fallback automático** entre provedores gratuitos, com transparência total na UI.

- **Groq · `llama-3.3-70b-versatile`** — padrão para geração de código.
- **Groq · `llama-3.1-8b-instant`** — tarefas curtas/rápidas.
- **Google · `gemini-2.0-flash`** — contexto longo (1M), multimodal.

Recursos de transparência no builder:

- **Badge do modelo** que efetivamente respondeu em cada mensagem.
- **Aviso de fallback** explícito quando há troca de modelo (com o motivo).
- **Painel de status** por provedor: consumo por minuto/dia e cooldown.

Variáveis no `.env.local` (BYO-key, nunca commitadas):

```
GROQ_API_KEY="..."
GOOGLE_GENERATIVE_AI_API_KEY="..."   # aceita as novas keys "AQ." do AI Studio
```

Endpoints: `POST /api/chat` (streaming) e `GET /api/llm/status`.

## API de Projetos

Todas exigem sessão válida.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/projects` | Lista os projetos do usuário |
| `POST` | `/api/projects` | Cria um projeto |
| `GET` | `/api/projects/[id]` | Detalha um projeto |
| `PATCH` | `/api/projects/[id]` | Atualiza campos do projeto |
| `DELETE` | `/api/projects/[id]` | Remove o projeto |

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing page (hero, features, comparativo, CTA) |
| `/login`, `/signup` | Autenticação real (NextAuth v5) |
| `/dashboard` | Projetos, templates e "novo app" |
| `/builder/[projectId]` | Builder de 3 zonas: chat/agente · preview · código/visual edits |

## Estrutura

```
src/
├── app/                 # rotas (App Router)
├── components/
│   ├── ui/              # primitives shadcn/ui
│   ├── landing/         # seções da landing
│   ├── dashboard/       # cards, prompt, header
│   ├── builder/         # chat, preview, código, modos, custo
│   ├── auth/            # formulário de auth
│   ├── logo.tsx
│   └── theme-*.tsx
│   └── session-provider.tsx
├── server/              # store em memória (usuários/projetos)
├── store/               # zustand (chat, ui)
├── lib/                 # utils, types, mock-data, actions
├── auth.ts              # instância NextAuth (Node)
├── auth.config.ts       # config base (Edge/middleware)
└── middleware.ts        # proteção de rotas
```

## Documentação

- **`docs/ARCHITECTURE.md`** — arquitetura técnica do sistema implementado.
- **`docs/PROJECT_STATUS.md`** — status, roadmap e histórico do projeto.
- **`ARCHITECTURE.md`** (raiz) — pesquisa comparativa e visão de produto inicial.

## Roadmap (próximas fases)

- **Etapa 1 (concluída):** auth real (NextAuth v5) + Prisma/Supabase + builder + chat multi-LLM + preview sandbox.
- **Curto prazo:** validar deploy Vercel, validar push GitHub, testes de integração, WebContainer para apps Node.js.
- **Médio prazo:** Visual Edits, checkpoints/versionamento, templates, mais provedores LLM, responsividade mobile.
- **Longo prazo:** colaboração em tempo real, canvas de agentes, marketplace, modelo de custo/BYO-key.
