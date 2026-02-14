
# Refinamento do Design System — Fundacao Visual do Veri OKR

## Objetivo

Padronizar toda a base visual do projeto antes de construir novas telas: espacamento baseado em grid de 8pt, raio de borda de 20px, escala tipografica consistente, componentes core refinados, layout responsivo flex-first e linguagem visual moderna com microinteracoes suaves.

---

## 1. Tokens Globais (CSS + Tailwind)

### 1.1 Espacamento 8pt
Substituir o valor de `--radius` e alinhar o spacing do Tailwind ao grid de 8pt. O Tailwind ja usa multiplos de 4px por padrao (p-1=4px, p-2=8px, p-4=16px, p-6=24px, p-8=32px), o que e compativel. A acao sera padronizar o uso nos componentes.

### 1.2 Raio de borda 20px
Atualizar `--radius` de `0.5rem` (8px) para `1.25rem` (20px). Isso propaga automaticamente para `rounded-lg`, `rounded-md` e `rounded-sm` via Tailwind config:
- `lg` = 20px (cards, modais, containers)
- `md` = 18px (botoes, inputs)
- `sm` = 16px (badges, elementos menores)

### 1.3 Escala tipografica
Padronizar os tamanhos no `tailwind.config.ts` para garantir consistencia:
- `2xs`: 10px (labels, metadados) — ja existe
- `xs`: 12px (captions, badges) — padrao Tailwind
- `sm`: 14px (corpo secundario) — padrao Tailwind
- `base`: 16px (corpo principal) — padrao Tailwind
- `lg`: 18px (subtitulos) — padrao Tailwind
- `xl`: 20px (titulos de secao) — padrao Tailwind
- `2xl`: 24px (titulos de pagina) — padrao Tailwind

Nao precisa alterar a config, mas padronizar o uso nos componentes.

---

## 2. Componentes Core

### 2.1 Button (button.tsx)
- Aumentar raio de borda para usar `rounded-[var(--radius)]` (20px) em vez de `rounded-md`
- Adicionar variante `cta` diretamente no CVA (trazendo o `.btn-cta` para dentro do componente React)
- Refinar transicoes: `transition-all duration-200 ease-out` + `active:scale-[0.97]` em todas as variantes
- Tamanhos alinhados ao grid 8pt: default h-10 (40px), sm h-8 (32px), lg h-12 (48px)

### 2.2 Card (card.tsx)
- Raio de borda `rounded-[var(--radius)]` (20px)
- Padding base `p-6` (24px — multiplo de 8) ja esta ok
- Adicionar variante `outline` (sem shadow, so borda) via prop opcional
- Transicao suave no hover: `transition-all duration-200 hover:shadow-md`

### 2.3 Input (input.tsx)
- Raio de borda `rounded-[calc(var(--radius)-2px)]` (18px)
- Altura h-10 (40px) — ja esta ok
- Padding px-4 (16px, multiplo de 8) em vez de px-3

### 2.4 Textarea (textarea.tsx)
- Raio de borda `rounded-[calc(var(--radius)-2px)]` (18px)
- Padding px-4 py-3 (16px / 12px)

### 2.5 Dialog/Modal (dialog.tsx)
- Raio de borda `rounded-[var(--radius)]` (20px)
- Overlay com backdrop-blur leve: `backdrop-blur-sm bg-black/60`
- Animacao de entrada com `animate-scale-in` ao inves de zoom

### 2.6 Badge (badge.tsx)
- Manter `rounded-full` para badges
- Nenhuma alteracao necessaria

### 2.7 Skeleton (skeleton.tsx)
- Raio de borda `rounded-[calc(var(--radius)-2px)]`
- Adicionar variante `.skeleton-text` para linhas de texto (altura fixa 12px)
- Adicionar variante `.skeleton-circle` para avatares

---

## 3. Classes Utilitarias no CSS (index.css)

### 3.1 Renomear/organizar classes utilitarias
Manter nomes limpos e semanticos:
- `card-elevated` — card com sombra (ja existe, atualizar raio)
- `card-interactive` — card clicavel (ja existe, atualizar raio)
- `card-outline` — novo, apenas borda sem sombra
- `stat-card` — cards de estatisticas (ja existe, atualizar raio)
- `btn-cta` — botao CTA dourado (ja existe, atualizar raio)
- `skeleton-text` — novo, skeleton para linhas de texto
- `skeleton-circle` — novo, skeleton circular

### 3.2 Atualizar raios em todas as classes CSS
Trocar todos os `rounded-lg` e `rounded-md` dentro das classes utilitarias para usar `var(--radius)`.

### 3.3 Microinteracoes globais
- `transition-smooth`: ja existe (200ms ease-out)
- `transition-spring`: ja existe (300ms spring)
- Adicionar `hover-lift`: `hover:translate-y-[-2px] hover:shadow-md`
- Adicionar `press-down`: `active:scale-[0.97] active:shadow-xs`

---

## 4. Layout Responsivo (flex-first)

### 4.1 DashboardLayout
- Padding da main area: `p-4 md:p-6 lg:p-8` (mobile-first, grid 8pt)
- Container max-width ja configurado em 1440px

### 4.2 Dashboard.tsx
- Grid responsivo ja usa `md:grid-cols-2 lg:grid-cols-3` — ok
- Ajustar gaps para multiplos de 8: `gap-4` (16px) e `gap-6` (24px) — ja ok

---

## 5. Arquivos a Modificar

| Arquivo | Alteracao |
|---------|----------|
| `src/index.css` | Atualizar `--radius` para 1.25rem; adicionar `card-outline`, `skeleton-text`, `skeleton-circle`, `hover-lift`, `press-down`; atualizar raios em classes existentes |
| `tailwind.config.ts` | Sem alteracoes estruturais — escala tipografica ja esta coberta |
| `src/components/ui/button.tsx` | Raio de borda, variante `cta`, transicao `active:scale-[0.97]` |
| `src/components/ui/card.tsx` | Raio de borda, transicao hover suave |
| `src/components/ui/input.tsx` | Raio de borda, padding horizontal |
| `src/components/ui/textarea.tsx` | Raio de borda, padding |
| `src/components/ui/dialog.tsx` | Raio de borda, overlay blur, animacao |
| `src/components/ui/skeleton.tsx` | Raio de borda, variantes text/circle |
| `src/components/layout/DashboardLayout.tsx` | Padding responsivo na main |

---

## Detalhes Tecnicos

### Variavel CSS atualizada
```css
--radius: 1.25rem; /* 20px */
```

### Tailwind borderRadius (propagacao automatica)
```
lg = var(--radius)          = 20px
md = calc(var(--radius)-2px) = 18px
sm = calc(var(--radius)-4px) = 16px
```

### Button CVA — nova variante `cta`
```typescript
cta: "bg-cta text-cta-foreground font-semibold hover:shadow-md active:scale-[0.97]"
```

### Skeleton — novas variantes
```tsx
function Skeleton({ className, variant, ...props }) {
  // variant: "default" | "text" | "circle"
}
```

### Novas classes CSS
```css
.card-outline {
  @apply rounded-[var(--radius)] border bg-transparent text-card-foreground;
}
.skeleton-text {
  @apply animate-pulse bg-muted h-3 rounded-[calc(var(--radius)-4px)];
}
.skeleton-circle {
  @apply animate-pulse bg-muted rounded-full;
}
.hover-lift {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.press-down:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-xs);
}
```
