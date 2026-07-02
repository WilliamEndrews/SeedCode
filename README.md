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
npm run dev
```

Acesse `http://localhost:3000`.

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing page (hero, features, comparativo, CTA) |
| `/login`, `/signup` | Autenticação (mock) |
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
├── store/               # zustand (chat, ui)
└── lib/                 # utils, types, mock-data
```

## Documentação

Veja `ARCHITECTURE.md` para a pesquisa comparativa, análise de inovações e a arquitetura completa do produto.

## Roadmap (próximas fases)

- Backend real (Node/Fastify ou Route Handlers) + auth (Clerk/NextAuth)
- Gateway multi-LLM (OpenAI, Claude, Grok, Gemini) com fallback
- Sandbox de execução (WebContainers/E2B) e preview real
- Git/GitHub e deploy nativos
- Colaboração em tempo real
