# SeedCode

> Plataforma **AI Builder** que combina e supera o melhor de **Lovable.dev** e **Base44.com**: chat inteligente, agentes autônomos, edição visual, multi-LLM, custo transparente e código 100% seu (sem lock-in).

Esta é a **fase de protótipo de UI navegável** — front-end de alta fidelidade com estado mockado (sem chamadas reais a LLM/sandbox). É a fundação real do produto, pronta para plugar o backend depois.

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

> **Nota (Fase 2A):** usuários e projetos vivem em um **store em memória** (`src/server/store.ts`), a ser substituído por Prisma/Supabase na Fase 2B.

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

Veja `ARCHITECTURE.md` para a pesquisa comparativa, análise de inovações e a arquitetura completa do produto.

## Roadmap (próximas fases)

- **Fase 2A (concluída):** auth real (NextAuth v5) + Route Handlers de projetos
- **Fase 2B:** banco de dados (Prisma/Supabase) + gateway multi-LLM (OpenAI, Claude, Grok, Gemini) com fallback
- Sandbox de execução (WebContainers/E2B) e preview real
- Git/GitHub e deploy nativos
- Colaboração em tempo real
