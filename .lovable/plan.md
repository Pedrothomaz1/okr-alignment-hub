

## Design System Overhaul: "LexFlow Style"

Replace the default shadcn/slate theme with a sophisticated enterprise green-toned design system featuring dark sidebar, semantic color tokens, custom card variants, CTA buttons, and polished interactions.

---

### What Changes

**1. Color Palette and CSS Variables (`src/index.css`)**

Complete replacement of all CSS custom properties with the LexFlow palette:

- Light mode: sage green primary (`165 35% 45%`), off-white backgrounds, green-dark sidebar (`153 16% 27%`)
- Dark mode: deep green background (`165 25% 8%`), elevated cards (`165 22% 12%`)
- New semantic tokens: `--success`, `--warning`, `--info`, `--critical`, `--primary-glow`, `--primary-subtle`
- Shadow variables (`--shadow-xs` through `--shadow-xl`) for light and dark
- Gradient variables (`--gradient-primary`, `--gradient-card`, `--gradient-hero`)
- Custom scrollbar styling, Inter font with OpenType features
- Utility classes: `.card-elevated`, `.card-interactive`, `.stat-card`, `.stat-card-primary/success/warning/destructive/critical`
- Button utilities: `.btn-cta` (gold CTA), `.btn-glow` (glow effect)
- Badge utilities: `.badge-success`, `.badge-warning`, `.badge-destructive`, `.badge-info`, `.badge-critical`
- Table utilities: `.table-row-hover`, `.table-zebra`
- Glass/blur utilities: `.backdrop-blur-glass`, `.text-gradient`, `.transition-smooth`, `.transition-spring`, `.focus-ring`
- `prefers-reduced-motion` media query support

**2. Tailwind Configuration (`tailwind.config.ts`)**

- Add new color tokens: `success`, `warning`, `info`, `critical`, `cta`, `sage` palette
- Container max-width updated to `1440px`, padding to `1.5rem`
- New font size `2xs` (0.625rem)
- Extended keyframes: `fade-in`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `scale-in`, `shimmer`, `pulse`
- Spring timing function via custom transition
- Box shadow overrides referencing CSS variables

**3. Typography Setup (`index.html`)**

- Add Inter font from Google Fonts with appropriate weights (400, 500, 600, 700)
- Apply font-feature-settings for `cv11`, `ss01`, `ss03` in CSS

**4. Update All Existing Pages**

All pages will be updated to use the new design tokens. Key visual changes:

- **Login / Signup / Forgot Password / MFA pages**: Green-tinted auth background, `.card-elevated` styling, `.btn-cta` for primary submit buttons, refined typography hierarchy
- **Dashboard**: Dark sidebar header area with green branding, stat cards using `.stat-card` variants, improved badge colors
- **Admin Layout**: Sidebar navigation with green-dark background, active state highlighting with primary color
- **Users & Roles**: Table with `.table-row-hover`, semantic badges for roles (`.badge-info`, `.badge-warning`)
- **Audit Logs**: Improved table density, better diff viewer with green-tinted code blocks
- **NotFound**: Styled with hero gradient background

**5. Remove Default Styles (`src/App.css`)**

Delete or clean up the default Vite/React boilerplate CSS that conflicts with the design system.

---

### Technical Details

**Files modified:**
- `src/index.css` -- Full rewrite of CSS variables + utility classes (~200 lines)
- `tailwind.config.ts` -- Extended colors, animations, shadows, fonts
- `index.html` -- Inter font link
- `src/App.css` -- Remove boilerplate
- `src/pages/Login.tsx` -- Apply LexFlow card/button styling
- `src/pages/Signup.tsx` -- Apply LexFlow card/button styling
- `src/pages/ForgotPassword.tsx` -- Apply LexFlow card/button styling
- `src/pages/Dashboard.tsx` -- Green header, stat cards, role badges
- `src/pages/NotFound.tsx` -- Hero gradient background
- `src/pages/MFASettings.tsx` -- Minor layout touch
- `src/pages/admin/AdminLayout.tsx` -- Dark green sidebar nav header
- `src/pages/admin/UsersRoles.tsx` -- Table hover, semantic badges
- `src/pages/admin/AuditLogs.tsx` -- Table styling, code block theming
- `src/components/auth/MFASetup.tsx` -- Card styling
- `src/components/auth/MFAVerify.tsx` -- Card styling

**No backend or database changes.** This is purely a frontend design system update.

**No new dependencies required.** Inter font loaded via CDN. All animations use CSS/Tailwind (no Framer Motion needed for Phase 1).

