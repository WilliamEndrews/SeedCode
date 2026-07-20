// =============================================================================
// Biblioteca mínima de templates/referências para guiar o LLM
// -----------------------------------------------------------------------------
// O sistema escolhe os snippets mais relevantes com base na intenção detectada
// no prompt do usuário e os injeta no system prompt. Isso ajuda usuários leigos
// a receberem apps mais estruturados sem precisar descrever cada detalhe.
// =============================================================================

const SNIPPETS: Record<string, string> = {
  landing: `Referência — Landing Page:
- index.html com <header> (logo + menu), <section id="hero"> (título, subtítulo, CTA), <section id="features"> (3 cards), <section id="cta"> e <footer>.
- styles.css com variáveis CSS (--primary, --background, --text), tipografia moderna, espaçamento consistente e responsividade mobile.
- script.js para menu mobile, smooth scroll e contador/leads básico.
- Use ícones via CDN (Lucide) e imagens placeholder do Unsplash.`,

  portfolio: `Referência — Portfólio:
- index.html com hero (nome/área), <section id="projetos"> em grid, <section id="sobre"> e <section id="contato">.
- styles.css com paleta elegante/neutra, cards com hover sutil e tipografia sofisticada.
- script.js para abrir modal de detalhes do projeto e alternar tema/claro escuro se útil.`,

  loja: `Referência — Loja Simples:
- index.html com header (logo + carrinho), grid de produtos (imagem, nome, preço, botão "Adicionar"), seção de destaque e footer.
- styles.css com cards de produto, badges de preço, carrinho flutuante e estados de hover.
- script.js para adicionar/remover itens do carrinho, calcular total e mostrar contagem de itens.`,

  dashboard: `Referência — Dashboard:
- index.html com sidebar, cards de métricas (4 indicadores), tabela/lista recente e área de gráfico/canvas simples.
- styles.css com layout grid, cards com sombra, tabela estilizada e responsividade.
- script.js para alternar abas, atualizar métricas de exemplo e ordenar/buscar itens.`,

  blog: `Referência — Blog/Conteúdo:
- index.html com header, lista de posts em cards (imagem, título, resumo, tag), post em destaque e sidebar opcional.
- styles.css com tipografia legível, espaçamento confortável e tags coloridas.
- script.js para filtrar posts por categoria/tag e destacar o post mais recente.`,

  tarefas: `Referência — App de Tarefas:
- index.html com input para nova tarefa, lista de tarefas (checkbox + texto), filtros (todas/ativas/concluídas) e contador.
- styles.css com lista clean, estados de tarefa concluída (riscado) e botões de ação.
- script.js para adicionar, concluir, excluir e filtrar tarefas, persistindo no localStorage.`,
};

const KEYWORDS: Record<string, string[]> = {
  landing: ["landing", "vendas", "página de vendas", "capturar", "leads", "captura", "promover", "serviço"],
  portfolio: ["portfólio", "portfolio", "fotografia", "trabalhos", "projetos pessoais", "galeria", "currículo"],
  loja: ["loja", "produtos", "vender", "e-commerce", "carrinho", "comprar", "varejo", "shop"],
  dashboard: ["dashboard", "analytics", "métricas", "painel", "admin", "controle", "estatísticas"],
  blog: ["blog", "conteúdo", "artigos", "posts", "notícias", "publicações"],
  tarefas: ["tarefas", "todo", "afazeres", "lista", "checklist", "organizador"],
};

export function pickTemplateCategories(text: string): string[] {
  const t = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    for (const keyword of keywords) {
      if (t.includes(keyword)) {
        scores[category] = (scores[category] ?? 0) + 1;
      }
    }
  }

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  return ranked.length > 0 ? ranked.slice(0, 2) : ["landing"];
}

export function getTemplateContext(text: string): string {
  const categories = pickTemplateCategories(text);
  const selected = categories
    .map((c) => SNIPPETS[c])
    .filter(Boolean)
    .join("\n\n");

  return `--- TEMPLATES E REFERÊNCIAS (use como base, adapte ao pedido) ---\n${selected}\n---`;
}
