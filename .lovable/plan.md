## Objetivo

Introduzir o conceito de **Business Unit (BU)** no Vektor Flow. Cada usuário pode pertencer a uma ou mais BUs e enxerga apenas dados (OKRs, Iniciativas, PPP/Pulse/Kudos, Equipe, Relatórios) das BUs às quais está associado. Admins e OKR Masters continuam vendo tudo.

---

## 1. Banco de Dados (migração)

### Novas tabelas
- **`business_units`**: `id`, `name` (único), `description`, `color` (opcional para badges), `archived`, `created_at`, `updated_at`, `created_by`.
- **`user_business_units`**: `id`, `user_id`, `business_unit_id`, `created_at`. Único `(user_id, business_unit_id)`. Vínculo N:N.

### Colunas adicionadas
- `cycles.business_unit_id` (nullable — ciclos podem ser globais quando nulo)
- `objectives.business_unit_id` (nullable — herda do ciclo se ausente; OKRs corporativos podem ficar nulos = visíveis a todos)
- `initiatives.business_unit_id` (nullable — quando nulo, visível a todos)

> KRs herdam BU do objetivo (sem coluna). PPP/Pulse/Kudos serão filtrados pela BU do `user_id` (via lookup em `user_business_units`).

### Função SECURITY DEFINER
- **`user_in_bu(_user_id uuid, _bu_id uuid) returns boolean`** — true se o usuário pertence à BU.
- **`user_can_see_bu(_user_id uuid, _bu_id uuid) returns boolean`** — true se admin/okr_master, ou BU é null, ou pertence à BU.

### RLS atualizado
- `business_units`: SELECT autenticados; INSERT/UPDATE/DELETE somente admin.
- `user_business_units`: SELECT do próprio usuário + admin; INSERT/DELETE somente admin.
- `cycles`, `objectives`, `initiatives`: SELECT passa a usar `user_can_see_bu(auth.uid(), business_unit_id)`.
- `weekly_ppp`, `pulse_surveys`, `kudos`: além das regras atuais, restringe SELECT a usuários cujo `user_id` compartilhe ao menos uma BU com o solicitante (admin/okr_master ignoram).

### Permissões RBAC
Inserir em `permissions` + `role_permissions`:
- `business_units.manage` (admin)
- `business_units.assign` (admin)

---

## 2. Hooks novos / atualizados

- `src/hooks/useBusinessUnits.ts` — CRUD de BUs (admin) e listagem para selects.
- `src/hooks/useUserBusinessUnits.ts` — gerenciar vínculos N:N do usuário (admin) e expor as BUs do usuário logado.
- `src/hooks/useMyBusinessUnits.ts` — array de `bu_id` do usuário logado (cache 5min) para filtragem client-side defensiva.
- Atualizar `useInitiatives`, `useObjectives`, `useCycles`, `useWeeklyPPP`, `usePulseSurvey`, `useKudos`, `useDashboardStats`, `useLeaderDashboard`, `useOKRTree` para incluir `business_unit_id` no select e nos filtros opcionais.
- `usePermissions`: adicionar chaves `business_units.manage` e `business_units.assign`.

---

## 3. UI

### Admin — gerenciamento de BUs
- Nova página **`/admin/business-units`** (`AdminRoute`):
  - Lista de BUs (nome, descrição, # usuários, ações editar/arquivar).
  - Modal criar/editar BU.
- Em **`/admin/users/:id`** (`UserDetail`): nova seção "Business Units" com multi-select para vincular/desvincular BUs do usuário.

### Sidebar
- Adicionar item "Business Units" no dropdown admin (`AppSidebar.tsx` — `adminItems`).

### Filtros por BU (toggle visual)
- Em **OKRs**, **Alinhamento**, **Iniciativas**, **Relatórios**, **Dashboard**: adicionar dropdown "Business Unit" (default: "Todas as minhas BUs"). Para admin/okr_master, opção extra "Todas".
- Formulários de criação (Cycle, Objective, Initiative): adicionar campo Select "Business Unit" (opcional para admin; pré-preenchido com a BU do usuário se ele tiver apenas uma).

### Badge de BU
- Mostrar badge colorido com nome da BU em cards de Objective, Initiative, Cycle.

---

## 4. Comportamento

- **Usuário comum**: ao logar, vê apenas dados das BUs em `user_business_units`. Itens com `business_unit_id = NULL` (corporativos) também são visíveis.
- **Usuário sem BU vinculada**: vê apenas itens corporativos (BU = null). Aparece aviso no Dashboard pedindo para o admin vincular uma BU.
- **Admin / OKR Master**: vêem tudo, podem alternar filtro por BU.
- **Criação**: campo BU obrigatório (exceto para admin que pode marcar "corporativo / sem BU").

---

## 5. Detalhes técnicos

### RLS exemplo (SELECT objetivos)
```sql
CREATE POLICY "BU-aware select objectives" ON public.objectives
FOR SELECT TO authenticated
USING (public.user_can_see_bu(auth.uid(), business_unit_id));
```

### Função
```sql
CREATE FUNCTION public.user_can_see_bu(_user_id uuid, _bu_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT
    _bu_id IS NULL
    OR public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'okr_master')
    OR EXISTS (
      SELECT 1 FROM public.user_business_units
      WHERE user_id = _user_id AND business_unit_id = _bu_id
    )
$$;
```

### Memória do projeto
Adicionar `mem://features/business-units` documentando: tabela própria, vínculo N:N, admin enxerga tudo, RLS via `user_can_see_bu`, escopo (OKRs/Iniciativas/Engajamento/Relatórios).

---

## 6. Arquivos impactados (resumo)

**Novos**
- `supabase/migrations/<ts>_business_units.sql`
- `src/hooks/useBusinessUnits.ts`
- `src/hooks/useUserBusinessUnits.ts`
- `src/hooks/useMyBusinessUnits.ts`
- `src/pages/admin/BusinessUnitsPage.tsx`
- `src/components/admin/BusinessUnitForm.tsx`
- `src/components/common/BUFilter.tsx`
- `src/components/common/BUBadge.tsx`

**Editados**
- `src/App.tsx` (rota nova)
- `src/components/layout/AppSidebar.tsx`
- `src/hooks/usePermissions.ts`
- `src/hooks/use{Initiatives,Objectives,Cycles,WeeklyPPP,PulseSurvey,Kudos,DashboardStats,LeaderDashboard,OKRTree}.ts`
- `src/pages/cycles/CycleForm.tsx`, `src/pages/objectives/ObjectiveForm.tsx`, `src/pages/initiatives/InitiativeForm.tsx`
- `src/pages/{Dashboard,initiatives/InitiativesList,objectives/ObjectivesList,alignment/AlignmentView,reports/ReportsPage}.tsx`
- `src/pages/admin/UserDetail.tsx`
- `mem://index.md` + nova memória

---

## 7. Validação

- Login como usuário membro de "BU A": só vê OKRs/Iniciativas/PPP de BU A + corporativos.
- Login como admin: vê tudo, pode filtrar por BU.
- Admin vincula usuário a 2 BUs → usuário vê dados das duas.
- Tentar acessar OKR de outra BU via URL direta → bloqueado pelo RLS.
