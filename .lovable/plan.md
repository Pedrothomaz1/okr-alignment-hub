

## Phase 5: Perfil do Usuario e Tema Escuro

Com as funcionalidades de negocio completas (Ciclos, OKRs, Dashboard), esta fase foca na experiencia do usuario: gerenciamento de perfil e alternancia entre tema claro/escuro.

---

### O que sera construido

1. **Pagina de Perfil** (`/settings/profile`):
   - Formulario para editar nome completo e avatar (URL)
   - Exibicao do email (somente leitura, vem do auth)
   - Exibicao dos papeis do usuario
   - Botao de salvar com feedback via toast

2. **Toggle de Tema Claro/Escuro**:
   - Botao no header global (DashboardLayout) para alternar entre light/dark
   - Usa `next-themes` (ja instalado) para persistir a preferencia
   - Integra com as variaveis CSS `.dark` ja definidas no design system

3. **Link de Perfil na Sidebar**:
   - Novo item "Meu Perfil" no grupo Configuracoes
   - Clicar no avatar no footer da sidebar tambem leva ao perfil

---

### Detalhes Tecnicos

**Novo arquivo:**
- `src/pages/Profile.tsx` -- Pagina de perfil com formulario que atualiza a tabela `profiles` via Supabase. Usa `useAuth` para obter o userId e query `["profile", userId]` para carregar/salvar dados.

**Arquivos modificados:**
- `src/main.tsx` -- Adicionar `ThemeProvider` do `next-themes` envolvendo o App
- `src/components/layout/DashboardLayout.tsx` -- Adicionar botao de toggle tema (Sun/Moon icon) no header
- `src/components/layout/AppSidebar.tsx` -- Adicionar item "Meu Perfil" (User icon) no grupo Configuracoes; tornar avatar no footer clicavel
- `src/App.tsx` -- Adicionar rota `/settings/profile` -> Profile

**Nenhuma mudanca de banco de dados necessaria** -- a tabela `profiles` ja existe com campos `full_name`, `avatar_url`, `email`.

**Nenhuma dependencia nova** -- `next-themes` ja esta instalado.

**Resumo de arquivos:**
- Criado (1): `src/pages/Profile.tsx`
- Modificados (4): `src/main.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/components/layout/AppSidebar.tsx`, `src/App.tsx`

