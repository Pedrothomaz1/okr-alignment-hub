

## Plano — OKR Org Chart Responsivo + Títulos legíveis + Linhas visíveis + Badge Lovable

### Problemas identificados

1. **Títulos cortados** — Os cards usam `truncate` (uma linha) nos títulos de objetivos, cortando nomes longos como "Estruturar a nossa fábrica pa..."
2. **Não responsivo** — Layout fixo com `min-w-max` e larguras fixas (`w-72`, `w-60`, `w-56`); em telas menores tudo fica comprimido
3. **Linhas da árvore quase invisíveis** — `bg-border` é muito sutil; as linhas verticais têm apenas `w-px` (1px) e a horizontal `h-px`
4. **Badge "Edit with Lovable"** — Está visível no site publicado; precisa ser ocultado

---

### Correções

#### 1. `OKROrgChart.tsx` — Responsividade + legibilidade + linhas

- **Títulos**: trocar `truncate` por `line-clamp-2` nos cards de objetivo para mostrar até 2 linhas
- **Larguras**: aumentar levemente os cards e usar `min-w` em vez de `w-` fixo para flexibilidade
- **Linhas conectoras**: aumentar espessura de `w-px` para `w-0.5` (2px) nas verticais e `h-0.5` nas horizontais; usar cor mais visível (`bg-border/80` ou `bg-muted-foreground/30`)
- **Container**: adicionar scroll horizontal suave com indicador visual; em mobile, permitir scroll touch
- **KR cards em leaf nodes**: quando muitos KRs, fazer wrap em grid responsivo em vez de linha horizontal infinita

#### 2. Badge Lovable — Ocultar via API

- Usar `set_badge_visibility({ hide_badge: true })` para esconder o badge "Edit with Lovable" do site publicado

---

### Arquivos alterados

1. **`src/components/okr/OKROrgChart.tsx`** — responsividade, line-clamp, linhas mais visíveis
2. **Badge visibility** — chamada de API para ocultar

