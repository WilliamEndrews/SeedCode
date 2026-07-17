<!-- =============================================================================
  SeedCode — Status, Roadmap e Histórico do Projeto
  -----------------------------------------------------------------------------
  Autor:       TechDoc Architect
  Versão:      1.0
  Data:        2026-07-17
  Status:      Ativo / em evolução
  Público:     Stakeholders, Product Owners, engenharia e gestão de projeto
============================================================================= -->

# SeedCode — Status, Roadmap e Histórico do Projeto

> Registro consolidado do que foi construído, decisões tomadas, pendências e
> próximos passos do SeedCode. Este documento é vivo e deve ser atualizado a
> cada marco ou mudança de escopo.

## Cabeçalho do Documento

| Campo          | Valor                                              |
|----------------|----------------------------------------------------|
| **Título**     | SeedCode — Status, Roadmap e Histórico            |
| **Versão**     | 1.0                                                |
| **Data**       | 2026-07-17                                         |
| **Autor**      | TechDoc Architect                                  |
| **Revisores**  | Equipe SeedCode                                    |
| **Status**     | Ativo                                              |
| **Público**    | Stakeholders, gestão, engenharia, QA               |

---

## Sumário Executivo

O SeedCode evoluiu de um **protótipo de UI navegável com dados mockados** para
uma aplicação full-stack com **persistência real em PostgreSQL (Supabase)**,
**autenticação funcional**, **chat multi-LLM com fallback**, **preview de
projetos** e integrações iniciais com **Vercel** e **GitHub**.

A **Etapa 1** (fundação) está concluída e validada: login, criação de projeto,
criação/edição de arquivos, preview renderizando e persistência após F5.

O maior ponto em aberto é a **publicação na Vercel**, que ainda retorna `400`
mesmo após a correção do payload de `projectSettings`. A validação final está
pendente de testes no ambiente real.

---

## Índice

1. [Visão e Objetivo](#1-visão-e-objetivo)
2. [Marcos e Histórico](#2-marcos-e-histórico)
3. [Funcionalidades Entregues](#3-funcionalidades-entregues)
4. [Funcionalidades Pendentes](#4-funcionalidades-pendentes)
5. [Riscos e Bloqueios](#5-riscos-e-bloqueios)
6. [Roadmap](#6-roadmap)
7. [Decisões Técnicas e Aprendizados](#7-decisões-técnicas-e-aprendizados)
8. [Métricas e Validação](#8-métricas-e-validação)
9. [Próximos Passos Imediatos](#9-próximos-passos-imediatos)
10. [Glossário](#10-glossário)
11. [Referências](#11-referências)
12. [Histórico de Revisões](#12-histórico-de-revisões)

---

## 1. Visão e Objetivo

### 1.1 Visão

Criar uma plataforma **AI Builder** que una o melhor de Lovable.dev
(chat/UX), Base44.com (superagent/backend) e inovações próprias
(multi-LLM, transparência de custo, exportação total, colaboração em tempo
real), entregando código 100% do usuário sem lock-in.

### 1.2 Objetivo Imediato

Validar a experiência completa de construção de um app a partir de uma
instrução em linguagem natural, passando por:

1. Criar projeto.
2. Conversar com o agente e gerar arquivos.
3. Ver preview ao vivo.
4. Editar manualmente.
5. Publicar na Vercel e/ou fazer push para o GitHub.

---

## 2. Marcos e Histórico

| Marco                                                | Status      | Data aprox. | Notas                                                              |
|------------------------------------------------------|-------------|-------------|---------------------------------------------------------------------|
| **M1 — Protótipo de UI navegável**                   | Concluído   | Fase 1      | Landing, auth mock, dashboard, builder de 3 zonas.                  |
| **M2 — Arquitetura e pesquisa comparativa**          | Concluído   | Fase 1      | Documento `ARCHITECTURE.md` na raiz.                                |
| **M3 — Autenticação real (NextAuth v5)**             | Concluído   | Etapa 1     | Credentials + Google/GitHub, sessão JWT, middleware.                |
| **M4 — Banco de dados real (Prisma + Supabase)**     | Concluído   | Etapa 1     | Migração do store em memória para PostgreSQL.                       |
| **M5 — CRUD de projetos e arquivos**                 | Concluído   | Etapa 1     | Soft-delete, roles, file-tree, editor.                              |
| **M6 — Preview sandbox e WebContainer**              | Parcial     | Etapa 1     | Preview estático funcionando; WebContainer em validação.            |
| **M7 — Chat multi-LLM com fallback**                 | Concluído   | Etapa 1     | Groq + Google; transparência de modelo/custo.                       |
| **M8 — Parser de blocos de código**                  | Concluído   | Etapa 1     | Extração de arquivos com múltiplos fallbacks.                       |
| **M9 — Integração Vercel (deploy)**                  | Em validação| Etapa 1     | Corrigido payload `projectSettings`; ainda retorna 400 em testes.   |
| **M10 — Integração GitHub (push)**                   | Parcial     | Etapa 1     | Rota implementada; validação final pendente.                        |
| **M11 — Tokens e variáveis de ambiente**             | Concluído   | Etapa 1     | `.env.local` configurado, scripts de validação criados.              |

---

## 3. Funcionalidades Entregues

### 3.1 Autenticação e Autorização

- Signup/login com e-mail/senha (bcrypt).
- Login social Google/GitHub.
- Sessão JWT via NextAuth v5.
- Proteção de rotas `/dashboard` e `/builder`.
- Usuário demo `demo@seedcode.dev` / `seedcode123` via seed.

### 3.2 Dashboard

- Lista de projetos do usuário (próprios + compartilhados).
- Criação de novo projeto com nome/descrição.
- Templates mockados para demonstração.
- Cards com gradiente e informações do projeto.

### 3.3 Builder

- Layout de três painéis: **chat**, **preview** e **código**.
- Header com nome do projeto, branch, ações (Exportar, GitHub, Publicar,
  Checkpoints, Compartilhar, tema).
- Controle de ação por papel (`owner`/`editor`/`viewer`).

### 3.4 Chat / Agente de IA

- Modos de trabalho: `agent`, `plan`, `visual`, `auto`.
- Seleção de modelo LLM.
- Streaming de respostas com atualização em tempo real.
- Painel de custo estimado e requisições.
- Painel de status de provedores (RPM, diário, cooldown).
- Exibição de badge do modelo que respondeu e aviso de fallback.
- Persistência do histórico de chat por projeto.

### 3.5 Geração e Gerenciamento de Arquivos

- Parser de blocos Markdown com múltiplos fallbacks (`path=`, nome de arquivo,
  linguagem).
- API de arquivos com upsert, leitura e delete.
- Soft-delete e rate-limit para writes/deletes.
- File-tree no painel de código.
- Editor de texto/CodeMirror para ajustes manuais.
- Evento `seedcode:files-changed` para recarregar preview automaticamente.

### 3.6 Preview

- Sandbox HTML multi-arquivo (inlining de CSS/JS).
- Suporte a `<iframe srcDoc>` com `allow-scripts allow-forms allow-modals`.
- Toggle desktop/mobile.
- WebContainerPreview dinamicamente importado para projetos Node.js.
- Recarregamento automático após alterações.

### 3.7 Integrações

- **Exportar ZIP** dos arquivos do projeto.
- **Publicar na Vercel** (rota implementada, em validação).
- **Push para GitHub** (rota implementada, cria repo privado + commit inicial).
- Scripts de validação de tokens Vercel/GitHub.

### 3.8 Infraestrutura e Qualidade

- Prisma + PostgreSQL no Supabase.
- Uso de connection pooler (PgBouncer) em runtime e conexão direta para
  migrações.
- Singleton Prisma Client para evitar esgotamento de conexões.
- TypeScript em toda a base de código.
- Testes unitários para `parseCodeBlocks`.
- Commits em português com Conventional Commits.

---

## 4. Funcionalidades Pendentes

| Funcionalidade / Débito Técnico                        | Prioridade | Status        | Observação                                                      |
|--------------------------------------------------------|------------|---------------|-----------------------------------------------------------------|
| Validar deploy na Vercel (erro 400)                    | Alta       | Em andamento  | Payload ajustado; aguardar teste com token real.                |
| Validar push para GitHub                               | Alta       | Pendente      | Rota implementada; precisa de teste end-to-end.                 |
| WebContainer para apps Node.js                         | Média      | Parcial       | Componente integrado visualmente; execução real não validada.   |
| Edição visual no preview (Visual Edits)                | Média      | Não iniciado  | Apenas editor manual de arquivos disponível.                    |
| Colaboração em tempo real (multiplayer)                | Média      | Não iniciado  | Schema `ProjectMember` preparado.                               |
| Versionamento / checkpoints                            | Média      | Não iniciado  | Botão "Checkpoints" existe apenas como UI.                      |
| Testes de integração das APIs                          | Alta       | Parcial       | Apenas parser tem testes unitários.                             |
| Cobertura de testes > 80%                              | Média      | Não iniciado  | Vitest configurado, mas poucos testes escritos.                 |
| Rate-limit persistente (Redis/DB)                      | Baixa      | Não iniciado  | Atualmente em memória; perdido em restart.                      |
| Gestão de BYO-key e cobrança                           | Baixa      | Não iniciado  | Custos são estimados e exibidos como zero (free tier).          |
| Mobile-first responsivo                                | Baixa      | Parcial       | Layout desktop-first; dashboard/builder não otimizados para mobile.|
| Documentação de API no padrão OpenAPI                  | Baixa      | Não iniciado  | Endpoints documentados em Markdown.                             |
| Pipeline CI/CD                                         | Baixa      | Não iniciado  | Deploy ainda manual e depende de token local.                   |

---

## 5. Riscos e Bloqueios

| Risco                                                              | Probabilidade | Impacto | Mitigação                                                    | Responsável |
|--------------------------------------------------------------------|---------------|---------|--------------------------------------------------------------|-------------|
| Vercel rejeitar deploy por configuração de framework ou payload    | Alta          | Alto    | Testar com `projectSettings` estático e, se necessário, usar framework slug explícito. | Engenharia  |
| Limites do free tier dos LLMs (Groq/Google) impactarem UX          | Média         | Alto    | Fallback automático já implementado; adicionar mais provedores. | Engenharia  |
| WebContainer não funcionar em produção por COOP/COEP               | Média         | Médio   | Validar headers e usar preview HTML como fallback.           | Engenharia  |
| Schema Prisma sofrer mudanças grandes na colaboração real          | Média         | Médio   | Manter migrations versionadas e seed scripts.                | Engenharia  |
| Falta de testes automatizados causar regressões                    | Alta          | Médio   | Priorizar testes de gateway, APIs e parser.                  | QA/Eng      |
| Dependência de tokens manuais dificultar onboarding de usuários    | Média         | Médio   | Futura UI de configuração de tokens e OAuth Vercel/GitHub.   | Produto     |

---

## 6. Roadmap

### 6.1 Curto Prazo (próximas 1–2 semanas)

1. Finalizar validação do deploy Vercel e corrigir retorno `400`.
2. Testar e ajustar push para GitHub.
3. Adicionar testes unitários/integração para `gateway.ts` e APIs de projetos.
4. Validar WebContainer com um projeto Node.js real.
5. Melhorar feedback de erros no chat e no builder.

### 6.2 Médio Prazo (próximos 1–2 meses)

1. Implementar **Visual Edits** (seleção de elemento no preview → gera diff).
2. Implementar **checkpoints/versionamento** por ação do agente.
3. Adicionar suporte a templates reutilizáveis.
4. Melhorar UI/UX mobile e responsividade.
5. Adicionar mais provedores de LLM (OpenAI, Anthropic, xAI).
6. Painel de administração de membros e convites.

### 6.3 Longo Prazo (3+ meses)

1. **Colaboração em tempo real** com presença e cursores.
2. **Canvas de orquestração de agentes** para fluxos complexos.
3. Integrações nativas (Stripe, Resend, Clerk, Supabase Auth wizards).
4. Marketplace de templates e blocos.
5. Modelo de cobrança/BYO-key transparente.
6. Aplicativo mobile e PWA.

---

## 7. Decisões Técnicas e Aprendizados

### 7.1 Decisões Principais

| Decisão                                                   | Motivação                                                                   |
|-----------------------------------------------------------|------------------------------------------------------------------------------|
| Next.js 14 App Router                                     | Base full-stack, SSR/SSG, API Routes e futura escalabilidade no mesmo repo. |
| NextAuth v5 com JWT                                       | Necessário para provider Credentials; simplifica sessão sem PrismaAdapter.  |
| Prisma + Supabase PostgreSQL                              | Banco relacional robusto, gratuito no tier inicial, suporte a pooler.       |
| `.env` para DB e `.env.local` para segredos               | Prisma CLI só lê `.env`; NextAuth/LLM leem `.env.local` sem conflito.       |
| Vercel AI SDK                                             | Abstração unificada para streaming e múltiplos provedores.                  |
| In-memory rate-limit                                      | MVP rápido; substituir por Redis/DB quando houver múltiplas instâncias.     |
| Protocolo de arquivo `path=` no info-string               | Padroniza saída do LLM e facilita parse confiável.                          |
| CustomEvent para comunicação entre painéis                | Evita prop-drilling e acopla levemente chat, editor e preview.              |

### 7.2 Aprendizados

- O parser precisou de múltiplos fallbacks porque modelos nem sempre seguem o
  protocolo à risca.
- O middleware do NextAuth pode invalidar Server Actions se interceptar `POST`;
  a solução foi permitir requisições não-GET diretamente.
- A Vercel API exige `projectSettings` para novos projetos ou o parâmetro
  `skipAutoDetectionConfirmation=1`, exigindo iteração no payload.
- O preview em `iframe srcDoc` precisa de `allow-modals` para que scripts do
  app gerado usem `alert()` e diálogos simples.

---

## 8. Métricas e Validação

| Aspecto                                         | Estado       | Evidência                                                    |
|-------------------------------------------------|--------------|--------------------------------------------------------------|
| Login/signup                                    | Validado     | Sessão JWT funcional, usuário demo acessa.                   |
| Criação/edição/deleção de projetos              | Validado     | CRUD via dashboard e API.                                    |
| Criação/edição/deleção de arquivos              | Validado     | File-tree + editor + persistência após F5.                   |
| Preview renderizando                            | Validado     | `index.html` com CSS/JS inline exibido no iframe.            |
| Geração de código via chat                      | Validado     | Blocos parseados e salvos corretamente.                      |
| Multi-LLM e fallback                            | Validado     | Troca automática entre Groq/Google quando indisponível.      |
| Preview de pop-ups (`alert`)                    | Corrigido    | `allow-modals` adicionado ao sandbox.                        |
| Deploy Vercel                                   | Pendente     | Testes retornam `400`; payload corrigido.                    |
| Push GitHub                                     | Parcial      | Token validado; rotina de commit criada, sem teste real.     |
| Testes automatizados                            | Parcial      | Parser testado; demais módulos sem cobertura.                |

---

## 9. Próximos Passos Imediatos

1. **Investigar o erro 400 do deploy Vercel** com logs completos da resposta.
2. **Testar push GitHub** criando um repositório real e verificando a branch.
3. **Escrever testes** para `gateway.ts`, `project-files.ts` e rotas críticas.
4. **Criar um exemplo de projeto Node.js** e validar `WebContainerPreview`.
5. **Atualizar documentação** à medida que os marcos forem concluídos.
6. **Definir milestones e datas** para o roadmap de médio prazo.

---

## 10. Glossário

| Termo              | Definição                                                     |
|--------------------|---------------------------------------------------------------|
| **Etapa 1**        | Fundação real: auth + DB + builder + chat + preview.          |
| **MVP**            | Produto mínimo viável em validação.                           |
| **BYO-key**        | Modelo onde o usuário usa suas próprias chaves de API.        |
| **Fallback**       | Alternância automática entre modelos LLM.                     |
| **Soft-delete**    | Marcação lógica de remoção sem exclusão física.               |
| **WebContainer**   | Runtime Node.js no navegador (WebAssembly).                   |

---

## 11. Referências

- `docs/ARCHITECTURE.md` — arquitetura técnica detalhada.
- `ARCHITECTURE.md` (raiz) — pesquisa comparativa e visão de produto inicial.
- `README.md` — instruções rápidas de setup.
- Repositório GitHub: `https://github.com/WilliamEndrews/SeedCode`.

---

## 12. Histórico de Revisões

| Versão | Data       | Autor             | Alterações                                 |
|--------|------------|-------------------|--------------------------------------------|
| 1.0    | 2026-07-17 | TechDoc Architect | Criação do documento de status e roadmap.  |
