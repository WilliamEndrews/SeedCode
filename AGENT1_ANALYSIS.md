# SeedCode — Análise de Estado Atual & Rota para o Agente 2

> **Autor:** Agente 1 — Pesquisador + Arquiteto de Software Sênior
> **Data:** Julho 2026
> **Objetivo:** Comparar o estado atual do SeedCode com os concorrentes (Lovable.dev e Base44.com), identificar o que foi entregue, o que está faltando e traçar a rota de desenvolvimento para o Agente 2.

---

## 1. Estado Atual vs. Concorrentes

### 1.1 Mapa de funcionalidades comparativo

| Funcionalidade | Lovable.dev | Base44.com | SeedCode HOJE | Prioridade |
|---|---|---|---|---|
| Auth (email + OAuth) | ✅ | ✅ | ✅ **Implementado** | — |
| Dashboard de projetos (CRUD) | ✅ | ✅ | ✅ **Implementado** | — |
| Chat com IA (streaming real) | ✅ | ✅ | ✅ **Implementado** | — |
| Multi-LLM com fallback | ❌ | ❌ | ✅ **Diferencial entregue** | — |
| Transparência de custo/modelo | ❌ | ❌ | ✅ **Diferencial entregue** | — |
| Modos Agent/Plan/Visual/Auto | ✅ | Parcial | ⚠️ **UI pronta, sem lógica real** | 🔴 Alta |
| Preview ao vivo do app gerado | ✅ | ✅ | ❌ **Ausente (empty state)** | 🔴 Alta |
| Geração real de código pelo agente | ✅ | ✅ | ❌ **Ausente** | 🔴 Alta |
| Sandbox de execução | ✅ | ✅ | ❌ **Ausente** | 🔴 Alta |
| Banco de dados persistente | ✅ | ✅ | ❌ **Store em memória (perde ao reiniciar)** | 🔴 Alta |
| Editor de código real (diffs) | ✅ | Parcial | ❌ **Empty state** | 🟡 Média |
| Checkpoints / time-travel | ✅ | ❌ | ❌ **Ausente** | 🟡 Média |
| Integração GitHub | ✅ | Parcial | ❌ **Ausente** | 🟡 Média |
| Deploy com 1 clique | ✅ | ✅ | ❌ **Ausente** | 🟡 Média |
| Visual Edits (edição no preview) | ✅ | ❌ | ⚠️ **UI pronta, sem lógica real** | 🟡 Média |
| Plan Mode com aprovação | ✅ | ❌ | ⚠️ **UI pronta, sem lógica real** | 🟡 Média |
| Colaboração em tempo real | Limitada | ❌ | ❌ **Ausente** | 🟢 Baixa |
| BYO-key (traga sua chave) | ❌ | ❌ | ⚠️ **Parcial (.env.local)** | 🟡 Média |
| Export de código sem lock-in | Bom | Limitado | ❌ **Ausente** | 🟡 Média |
| Templates full-stack | ✅ | ✅ | ⚠️ **Mock, sem geração real** | 🟡 Média |

---

## 2. O que foi entregue (Fases 1 a 2B)

### Fase 1 — Protótipo de UI
- Landing page completa (hero, features, comparativo, CTA)
- Telas de auth (login/signup)
- Dashboard com grid de projetos e templates
- Builder de 3 zonas: chat · preview · código/visual edits
- Design system (shadcn/ui, dark mode, Framer Motion)

### Fase 2A — Backend de Autenticação e Projetos
- NextAuth v5 com credenciais (bcrypt) e OAuth Google/GitHub
- Store em memória com `globalThis` (sobrevive hot-reload)
- API REST completa: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`
- Middleware de proteção de rotas (Edge Runtime)
- Usuário demo: `demo@seedcode.dev` / `seedcode123`

### Fase 2B — Multi-LLM Gateway
- Gateway com fallback automático: Groq (Llama 3.3 70B / 3.1 8B) → Google Gemini 2.0 Flash
- Rate-limit tracker por provedor (RPM, diário, cooldown)
- Chat com streaming real via Vercel AI SDK v4
- Badge do modelo que respondeu em cada mensagem
- Aviso de fallback com motivo visível na UI
- Painel de status dos provedores (recolhível)
- `POST /api/chat` e `GET /api/llm/status`

### Correções desta sessão
- Fluxo de criação de projetos: `/builder/new` cria projeto real e redireciona para `/builder/[id]`
- Builder carrega projeto do store real (não mais mocks)
- Preview e CodePanel com empty state por projeto (sem TaskFlow hardcoded)
- Scroll independente nas 3 colunas do builder (min-h-0 + overflow-hidden)
- Headers `X-LLM-*` expostos ao cliente (Access-Control-Expose-Headers)

---

## 3. O que está FALTANDO — Análise crítica

### 3.1 Buraco crítico: sem geração real de código

Este é o coração do produto e ainda não existe. O chat conversa com a IA, mas **a resposta não se materializa em código/preview**. O usuário vê texto no chat mas nada acontece nas outras abas. Isso precisa ser o próximo grande entregável.

**O que falta para fechar esse gap:**

1. **Sandbox de execução** — ambiente isolado onde o código gerado roda. Opções:
   - **WebContainers (StackBlitz)** — roda Node.js no browser, zero latência, gratuito para OSS
   - **E2B** — sandbox cloud com terminal real, mais robusto, tem free tier
   - **iframe simples** — para apps estáticos HTML/CSS/JS (solução mínima viável para MVP)

2. **Orquestrador de agente** — o chat precisa interpretar a resposta da IA e aplicar as mudanças nos arquivos do projeto. Atualmente a resposta é só texto.

3. **Sistema de arquivos virtual** — estrutura de arquivos do projeto em memória/banco, que o agente possa ler e escrever.

4. **Preview conectado ao sistema de arquivos** — o `PreviewPane` precisa exibir o resultado real do sandbox.

5. **CodePanel com editor real** — exibir os arquivos gerados com syntax highlight e diffs.

### 3.2 Banco de dados persistente

O store em memória perde todos os dados quando o servidor reinicia. Em produção isso é inaceitável.

**O que falta:**
- Prisma ORM + PostgreSQL (Supabase ou Railway)
- Migrar `src/server/store.ts` para queries Prisma
- Schema: `User`, `Project`, `ProjectFile`, `Checkpoint`

### 3.3 Modos do agente sem lógica real

Os modos **Plan**, **Visual** e **Auto** têm UI mas:
- **Plan Mode:** o agente apresenta plano em texto, mas não há aprovação que dispare execução
- **Visual Edits:** o slider/color picker não altera nada no preview
- **Auto Mode:** igual ao Agent Mode na prática

### 3.4 Funcionalidades de plataforma ausentes
- Sem export/download do código
- Sem integração GitHub (push/pull)
- Sem deploy integrado (Vercel/Netlify)
- Sem checkpoints reversíveis
- BYO-key existe no `.env.local` mas não há UI para o usuário colocar a própria chave

---

## 4. Rota para o Agente 2 — Próximas Fases

### Fase 3 — Banco de Dados Real (PRIORIDADE MÁXIMA)

**Objetivo:** substituir o store em memória por Prisma + PostgreSQL (Supabase).

**Tarefas:**
1. Adicionar `prisma`, `@prisma/client` ao `package.json`
2. Criar `prisma/schema.prisma` com models: `User`, `Account`, `Session`, `Project`
3. Configurar `DATABASE_URL` no `.env.local`
4. Migrar todas as funções de `src/server/store.ts` para queries Prisma
5. Adaptar `src/auth.ts` para usar Prisma Adapter do NextAuth
6. Manter a API REST intacta (sem mudar contratos)

**Entregável:** dados persistem entre restarts; múltiplos usuários funcionam em produção.

---

### Fase 4 — Sistema de Arquivos Virtual + Sandbox (CORE DO PRODUTO)

**Objetivo:** o agente gera código que aparece no preview e no editor.

**Tarefas:**
1. Adicionar model `ProjectFile` ao Prisma schema (`id`, `projectId`, `path`, `content`, `createdAt`)
2. Criar `src/server/sandbox/` com abstração do sistema de arquivos virtual
3. Implementar `POST /api/projects/[id]/files` (ler/escrever arquivos)
4. Integrar **WebContainers** (MVP mais rápido) ou iframe para apps HTML estáticos
5. Conectar `PreviewPane` ao sandbox — exibir o app real
6. Conectar `CodePanel` — exibir `ProjectFile` com syntax highlight (Monaco Editor ou Shiki)
7. **Reformular o `sendMessage` no `chat-store`:**
   - Ao receber resposta da IA, extrair blocos de código (regex ou AST)
   - Aplicar os arquivos no sistema de arquivos virtual
   - Disparar rebuild no sandbox
   - Atualizar o preview automaticamente

**Entregável:** usuário digita "crie um botão" → código aparece no editor e preview atualiza.

---

### Fase 5 — Orquestrador de Agente Real (Plan Mode + Tool Calls)

**Objetivo:** agente autônomo que planeja, escreve, roda e corrige.

**Tarefas:**
1. Implementar **tool calls** na API de chat:
   - `write_file(path, content)` — escreve arquivo no projeto
   - `read_file(path)` — lê arquivo atual
   - `run_terminal(command)` — roda comando no sandbox
   - `create_checkpoint(label)` — salva snapshot do projeto
2. **Plan Mode real:** agente gera plano estruturado → usuário aprova → agente executa tool calls sequencialmente
3. **Checkpoints:** salvar snapshot de `ProjectFile[]` a cada ação significativa, com UI de time-travel
4. **Loop de correção:** se sandbox retornar erro de build, agente recebe o erro e tenta corrigir automaticamente

**Entregável:** Agent Mode funciona de verdade — escreve, roda, corrige, faz checkpoint.

---

### Fase 6 — Visual Edits Real

**Objetivo:** clicar em elemento no preview → editar propriedade → gera diff no código.

**Tarefas:**
1. Injetar script de seleção de elementos no iframe do sandbox
2. Ao clicar, identificar componente React e localizar no `ProjectFile`
3. Painel de edição (cor, fonte, espaçamento) gera patch no arquivo
4. Aplicar patch → rebuild → preview atualiza

---

### Fase 7 — Plataforma (Export, GitHub, Deploy, BYO-Key)

**Objetivo:** funcionalidades de plataforma que diferenciam do Lovable.

**Tarefas:**
1. **Export:** `GET /api/projects/[id]/export` → ZIP com todos os `ProjectFile`
2. **BYO-Key UI:** página de configurações do usuário com campo para inserir suas próprias API keys (criptografadas no banco)
3. **GitHub:** OAuth GitHub App, push/pull de `ProjectFile` para repositório do usuário
4. **Deploy:** integração Vercel API — `POST /api/projects/[id]/deploy` dispara deploy e retorna URL

---

### Fase 8 — Colaboração em Tempo Real

**Objetivo:** múltiplos usuários no mesmo builder.

**Tarefas:**
1. Adicionar **Liveblocks** ou **Partykit** para presença e cursores
2. Sincronizar `ProjectFile` em tempo real (CRDT ou OT simples)
3. Chat compartilhado no builder

---

## 5. Priorização Resumida para o Agente 2

```
AGORA (bloqueante para produto viável):
  └── Fase 3: Banco de dados Prisma/Supabase
  └── Fase 4: Sistema de arquivos + Sandbox + Preview real

DEPOIS (completa o loop do agente):
  └── Fase 5: Orquestrador + Tool calls + Plan Mode real + Checkpoints

DEPOIS (diferenciais de plataforma):
  └── Fase 6: Visual Edits real
  └── Fase 7: Export + GitHub + Deploy + BYO-Key

FUTURO (vantagem competitiva):
  └── Fase 8: Colaboração em tempo real
```

---

## 6. Débitos Técnicos Atuais

| Débito | Arquivo | Impacto |
|---|---|---|
| Store em memória perde dados no restart | `src/server/store.ts` | 🔴 Bloqueante para produção |
| Google API key com formato inválido (`AQ.`) | `.env.local` | 🟡 Gemini não funciona |
| Modos Plan/Visual/Auto sem lógica real | `src/store/chat-store.ts` | 🟡 UI enganosa |
| Preview e CodePanel com empty state | `preview-pane.tsx`, `code-panel.tsx` | 🔴 Core do produto ausente |
| Sem testes automatizados (unit/e2e) | — | 🟡 Risco de regressão |
| `MOCK_PROJECTS` ainda referenciados no store seed | `src/server/store.ts` | 🟢 Cosmético |

---

## 7. Variáveis de Ambiente Necessárias nas Próximas Fases

```env
# Fase 3 — Banco de dados
DATABASE_URL="postgresql://..."          # Supabase/Railway/Neon

# Fase 4 — Sandbox
E2B_API_KEY="..."                        # se usar E2B

# Fase 7 — GitHub OAuth App
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Fase 7 — Deploy
VERCEL_TOKEN="..."
VERCEL_TEAM_ID="..."
```

---

> **Para o Agente 2:** comece pela **Fase 3** (Prisma). É o alicerce que tudo o mais depende. Depois vá direto para a **Fase 4** (sandbox + preview real) — é o coração do produto e o que mais diferencia o SeedCode de um simples chatbot. As fases 5 em diante constroem sobre essa base.
