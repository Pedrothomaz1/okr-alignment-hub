# Design System Padrão — Veri OKR

Antes de construir qualquer tela, aplique este Design System como fundação visual do projeto.

---

## 1. Tokens Globais

### Raio de borda
`--radius: 1.25rem` (20px). Propagar via Tailwind:
- `lg` = `var(--radius)` → 20px (cards, modais)
- `md` = `calc(var(--radius)-2px)` → 18px (botões, inputs)
- `sm` = `calc(var(--radius)-4px)` → 16px (badges, elementos menores)

### Espaçamento 8pt
Usar múltiplos de 8px em todos os paddings/margins/gaps:
- `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px)
- `gap-4` (16px), `gap-6` (24px)

### Escala tipográfica
- `2xs`: 10px (metadados) | `xs`: 12px (captions) | `sm`: 14px (corpo secundário)
- `base`: 16px (corpo) | `lg`: 18px (subtítulos) | `xl`: 20px (títulos seção) | `2xl`: 24px (títulos página)

### Sombras semânticas
- `--shadow-xs`: sombra mínima
- `--shadow-sm`: sombra leve (cards em repouso)
- `--shadow-md`: sombra média (hover)
- `--shadow-lg`: sombra forte (modais, popovers)
- `--shadow-xl`: sombra máxima (elementos flutuantes)

---

## 2. Paleta de Cores

Todas em HSL, definidas em `src/index.css`:

### Light Mode

| Token | HSL |
|---|---|
| `--background` | `100 20% 98%` |
| `--foreground` | `153 16% 15%` |
| `--card` | `0 0% 100%` |
| `--card-foreground` | `153 16% 15%` |
| `--popover` | `0 0% 100%` |
| `--popover-foreground` | `153 16% 15%` |
| `--primary` | `165 35% 45%` |
| `--primary-foreground` | `80 17% 95%` |
| `--primary-glow` | `165 40% 55%` |
| `--primary-subtle` | `165 25% 92%` |
| `--secondary` | `165 15% 93%` |
| `--secondary-foreground` | `153 16% 27%` |
| `--muted` | `165 12% 93%` |
| `--muted-foreground` | `165 8% 46%` |
| `--accent` | `165 15% 93%` |
| `--accent-foreground` | `153 16% 27%` |
| `--destructive` | `13 69% 55%` |
| `--destructive-foreground` | `0 0% 100%` |
| `--success` | `153 45% 42%` |
| `--success-foreground` | `0 0% 100%` |
| `--warning` | `35 58% 61%` |
| `--warning-foreground` | `153 16% 15%` |
| `--info` | `200 65% 50%` |
| `--info-foreground` | `0 0% 100%` |
| `--critical` | `344 62% 39%` |
| `--critical-foreground` | `0 0% 100%` |
| `--cta` | `43 82% 68%` |
| `--cta-foreground` | `153 16% 27%` |
| `--border` | `165 15% 88%` |
| `--input` | `165 15% 88%` |
| `--ring` | `165 35% 45%` |
| `--sidebar-background` | `153 16% 27%` |
| `--sidebar-foreground` | `80 17% 95%` |
| `--sidebar-primary` | `153 13% 56%` |
| `--sidebar-accent` | `153 20% 23%` |
| `--sidebar-border` | `153 20% 23%` |

### Dark Mode

| Token | HSL |
|---|---|
| `--background` | `165 25% 8%` |
| `--foreground` | `80 17% 95%` |
| `--card` | `165 22% 12%` |
| `--primary` | `165 35% 50%` |
| `--primary-glow` | `165 40% 60%` |
| `--primary-subtle` | `165 20% 18%` |
| `--secondary` | `165 18% 16%` |
| `--muted` | `165 15% 16%` |
| `--muted-foreground` | `165 10% 60%` |
| `--destructive` | `13 69% 45%` |
| `--success` | `153 45% 38%` |
| `--warning` | `35 58% 55%` |
| `--info` | `200 65% 45%` |
| `--critical` | `344 62% 35%` |
| `--cta` | `43 82% 62%` |
| `--border` | `165 15% 18%` |
| `--sidebar-background` | `153 18% 10%` |
| `--sidebar-accent` | `153 15% 15%` |

### Gradientes
- `--gradient-primary`: `linear-gradient(135deg, hsl(primary), hsl(primary-glow))`
- `--gradient-card`: `linear-gradient(180deg, hsl(card), hsl(muted sutil))`
- `--gradient-hero`: `linear-gradient(135deg, hsl(sidebar-bg), hsl(sidebar mid-tone))`

### Identidade Visual
- **Cor primária**: Verde-teal (`hsl 165°`)
- **CTA / Destaque**: Dourado/âmbar (`hsl 43°`)
- **Sidebar**: Verde-floresta escuro (`hsl 153°`)

---

## 3. Componentes Core

### Button (CVA)
- Raio: `rounded-[calc(var(--radius)-2px)]`
- Transição: `transition-all duration-200 ease-out` + `active:scale-[0.97]`
- Tamanhos: `sm`=h-8, `default`=h-10, `lg`=h-12
- Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `cta`
- Variante `cta`: `bg-cta text-cta-foreground font-semibold hover:shadow-md`

### Card
- Raio: `rounded-[var(--radius)]`
- Transição: `transition-all duration-200 hover:shadow-md`
- Padding base: `p-6`

### Input / Textarea
- Raio: `rounded-[calc(var(--radius)-2px)]`
- Padding horizontal: `px-4`
- Altura input: `h-10`

### Dialog/Modal
- Raio: `rounded-[var(--radius)]`
- Overlay: `backdrop-blur-sm bg-black/60`
- Animação: `animate-scale-in`

### Skeleton
- Variantes: `default` (rounded-md), `text` (h-3), `circle` (rounded-full)

### Badge
- Sempre `rounded-full`

---

## 4. Classes Utilitárias CSS

Definidas em `src/index.css` dentro de `@layer components`:

| Classe | Descrição |
|---|---|
| `.card-elevated` | border + shadow-sm + hover:shadow-md |
| `.card-interactive` | card-elevated + cursor-pointer + hover:translateY(-1px) + active:scale(0.98) |
| `.card-outline` | border + bg-transparent |
| `.stat-card` | border + p-5 + hover:translateY(-2px) |
| `.stat-card-primary/success/warning/destructive/critical` | border-left colorido |
| `.hover-lift` | hover:translateY(-2px) + hover:shadow-md |
| `.press-down` | active:scale(0.97) |
| `.transition-smooth` | 200ms ease-out |
| `.transition-spring` | 300ms cubic-bezier(0.34,1.56,0.64,1) |
| `.skeleton-text` | animate-pulse h-3 |
| `.skeleton-circle` | animate-pulse rounded-full |
| `.backdrop-blur-glass` | backdrop-blur-xl + bg semi-transparente |
| `.text-gradient` | gradient no texto |
| `.btn-cta` | botão CTA com hover dourado |
| `.btn-glow` | pseudo-elemento com gradient glow |
| `.badge-success/warning/destructive/info/critical` | badges coloridos |
| `.focus-ring` | anel de foco acessível |

---

## 5. Layout Responsivo

- Mobile-first: `p-4 md:p-6 lg:p-8`
- Container max-width: `1440px`
- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Gaps alinhados ao 8pt: `gap-4`, `gap-6`

---

## 6. Regras Gerais

- **NUNCA** usar cores hardcoded — sempre tokens semânticos (`bg-primary`, `text-foreground`, etc.)
- **NUNCA** usar `rounded-lg`/`rounded-md` direto — sempre `var(--radius)` ou `calc()`
- Todas as cores em HSL via variáveis CSS
- Suportar dark mode com tokens duplicados no `.dark {}`
- Usar `@media (prefers-reduced-motion: reduce)` para acessibilidade
- Componentes React com shadcn/ui + CVA para variantes
- Fonte: Inter com font-feature-settings: "cv11", "ss01", "ss03"
