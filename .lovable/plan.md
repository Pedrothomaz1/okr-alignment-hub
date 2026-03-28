

## Tela de Gerenciamento de Iniciativas

Criar uma nova seção completa para gerenciar Iniciativas — ações corretivas criadas quando resultados do plano estratégico não são atingidos, separadas dos OKRs.

### Campos da Iniciativa
- **Data** (data de criação)
- **Unidade** (unidade de negócio)
- **Linha da DRE** (linha do P&L: Receita, COGS, Despesas Operacionais, etc.)
- **Ação** (descrição da iniciativa)
- **Dono** (responsável, selecionado entre usuários ativos)
- **Prazo** (data limite)
- **Status** (pendente, em andamento, concluída, cancelada)
- **Impacto esperado** (texto livre descrevendo o impacto financeiro/operacional)

---

### 1. Criar tabela `initiatives` no banco

Nova migration com a tabela e RLS policies:
- Qualquer autenticado pode visualizar
- Admin/OKR master pode criar, editar e deletar
- O dono (owner) também pode editar suas próprias iniciativas

Colunas: `id`, `created_at`, `updated_at`, `date`, `unit`, `dre_line`, `action`, `owner_id` (ref profiles), `deadline`, `status`, `expected_impact`, `created_by`

### 2. Criar hook `useInitiatives`

Hook com React Query para CRUD da tabela `initiatives`, seguindo o padrão dos hooks existentes (ex: `useCycles`). Inclui queries para listar, criar, atualizar e deletar.

### 3. Criar página `InitiativesList`

Página em `src/pages/initiatives/InitiativesList.tsx`:
- Tabela com todas as colunas solicitadas
- Botão "Nova Iniciativa" (para admin/okr_master)
- Ações de editar/excluir por linha
- Badges de status coloridos
- Formatação de datas em pt-BR

### 4. Criar formulário `InitiativeForm`

Dialog/modal com formulário para criar/editar iniciativa:
- Select para Unidade (texto livre ou lista predefinida)
- Select para Linha da DRE (Receita, CPV, Despesas Operacionais, EBITDA, etc.)
- Select para Dono (lista de perfis ativos)
- DatePicker para Data e Prazo
- Select para Status
- Textarea para Ação e Impacto esperado

### 5. Adicionar rota e link na sidebar

- Nova rota `/initiatives` no `App.tsx`
- Novo item "Iniciativas" no grupo "Gestão" da sidebar (visível para leaders/admin)

---

### Detalhes técnicos

**Migration SQL:**
```sql
CREATE TABLE public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  unit TEXT NOT NULL,
  dre_line TEXT NOT NULL,
  action TEXT NOT NULL,
  owner_id UUID NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expected_impact TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view initiatives" ON public.initiatives
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/OKR master can create initiatives" ON public.initiatives
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'okr_master'));

CREATE POLICY "Admin/OKR master/owner can update initiatives" ON public.initiatives
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'okr_master') OR owner_id = auth.uid());

CREATE POLICY "Admin can delete initiatives" ON public.initiatives
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

**Novos arquivos:**
- `src/hooks/useInitiatives.ts`
- `src/pages/initiatives/InitiativesList.tsx`
- `src/pages/initiatives/InitiativeForm.tsx`

**Arquivos modificados:**
- `src/App.tsx` — nova rota `/initiatives`
- `src/components/layout/AppSidebar.tsx` — novo item no menu Gestão

