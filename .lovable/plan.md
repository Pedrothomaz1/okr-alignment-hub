

## Fase 9: OKR Cascading -- Links, Colaboradores e Tree View

Implementar hierarquia de objetivos (parent/child), links entre OKRs, colaboradores e visualizacao em arvore conforme o PRD.

---

### O que sera construido

1. **Coluna `parent_objective_id`** na tabela `objectives` para hierarquia pai-filho
2. **Tabela `okr_links`** para cross-links entre OKRs (dependencias)
3. **Tabela `okr_collaborators`** para editores/visualizadores em OKRs
4. **Funcao `get_objective_ancestors`** para breadcrumb de alinhamento
5. **Trigger de validacao** para impedir referencia circular em parent_objective_id
6. **RLS** para as novas tabelas
7. **Hooks** `useOKRTree`, `useOKRLinks`, `useOKRCollaborators`
8. **Componente OKRTreeView** para visualizacao em arvore (collapsible)
9. **Breadcrumb de alinhamento** no ObjectiveDetail
10. **Seletor de pai e colaboradores** no ObjectiveForm
11. **Nova pagina `/alignment`** com visao geral da arvore de OKRs

---

### Etapa 1 -- Migracao de banco de dados

**Coluna nova em `objectives`:**
- `parent_objective_id` UUID nullable FK -> objectives.id (auto-referencia)

**Tabela `okr_links`:**
- `id` UUID PK
- `from_id` UUID (objetivo ou KR de origem)
- `to_id` UUID (objetivo ou KR de destino)
- `link_type` TEXT (`child`, `dependency`, `related`)
- `created_by` UUID
- `created_at` timestamptz
- Constraint UNIQUE(from_id, to_id)

**Tabela `okr_collaborators`:**
- `id` UUID PK
- `objective_id` UUID FK -> objectives.id
- `user_id` UUID
- `role` TEXT (`editor`, `viewer`)
- `created_at` timestamptz
- Constraint UNIQUE(objective_id, user_id)

**RLS para `okr_links`:**
- SELECT: qualquer usuario autenticado
- INSERT: admin, okr_master ou dono dos OKRs envolvidos
- DELETE: admin ou criador do link

**RLS para `okr_collaborators`:**
- SELECT: qualquer usuario autenticado
- INSERT/UPDATE/DELETE: admin, okr_master ou dono do objetivo

**Funcao `get_objective_ancestors(objective_id UUID)`:**
- Retorna a cadeia de pais ate a raiz usando CTE recursiva
- Usada para breadcrumb de alinhamento

**Trigger `prevent_circular_parent`:**
- BEFORE INSERT/UPDATE em objectives
- Verifica se parent_objective_id nao cria referencia circular percorrendo a cadeia de pais
- Raise exception se detectar ciclo

**Triggers de auditoria** reutilizando `audit_trigger_fn` existente nas novas tabelas

---

### Etapa 2 -- Hooks de dados

**`src/hooks/useOKRTree.ts`**
- Query que busca todos os objetivos de um ciclo com parent_objective_id
- Funcao helper para montar estrutura de arvore (nesting) no cliente
- Query para buscar ancestrais de um objetivo (chama `get_objective_ancestors` via RPC)

**`src/hooks/useOKRLinks.ts`**
- Query para listar links de um objetivo/KR
- Mutations para criar e remover links
- Invalida queries relacionadas no sucesso

**`src/hooks/useOKRCollaborators.ts`**
- Query para listar colaboradores de um objetivo
- Mutations para adicionar, alterar role e remover colaboradores
- Invalida queries relacionadas

---

### Etapa 3 -- Atualizar ObjectiveForm

**Arquivo: `src/pages/objectives/ObjectiveForm.tsx`**

- Adicionar campo "Objetivo Pai" (select com lista de objetivos do mesmo ciclo, excluindo o proprio e seus filhos)
- Adicionar secao "Colaboradores" com campo de busca de usuarios e seletor de role (editor/viewer)
- Salvar parent_objective_id no insert/update de objectives
- Salvar colaboradores via hook useOKRCollaborators

---

### Etapa 4 -- Atualizar useObjectives

**Arquivo: `src/hooks/useObjectives.ts`**

- Incluir `parent_objective_id` na interface Objective
- Incluir no select e nas mutations de create/update

---

### Etapa 5 -- Breadcrumb de alinhamento no ObjectiveDetail

**Arquivo: `src/pages/objectives/ObjectiveDetail.tsx`**

- Buscar ancestrais via `get_objective_ancestors` RPC
- Renderizar breadcrumb clicavel acima do titulo (ex: "Estrategia > Crescimento > Objetivo atual")
- Mostrar lista de colaboradores com badge de role
- Mostrar secao "Links" com dependencias e objetivos relacionados
- Botao "Adicionar Link" para vincular a outros OKRs

---

### Etapa 6 -- Componente OKRTreeView

**Novo arquivo: `src/components/okr/OKRTreeView.tsx`**

- Componente recursivo que renderiza arvore de objetivos usando collapsible (Radix Collapsible ja instalado)
- Cada no mostra: titulo, progresso, status badge, owner, contagem de KRs
- Clique no titulo navega para ObjectiveDetail
- Indicador visual de nivel (indentacao com linhas de conexao via CSS)
- Sem dependencia externa pesada (sem react-d3-tree) -- usar componente leve com Collapsible + recursao

---

### Etapa 7 -- Nova pagina Alignment

**Novo arquivo: `src/pages/alignment/AlignmentView.tsx`**

- Pagina acessivel via sidebar `/alignment`
- Seletor de ciclo no topo
- Renderiza OKRTreeView com todos os objetivos do ciclo selecionado
- Filtros: por owner, por status
- Expandir/colapsar todos

**Atualizacoes:**
- `src/App.tsx`: adicionar rota `/alignment`
- `src/components/layout/AppSidebar.tsx`: adicionar item "Alinhamento" no menu principal

---

### Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Migracao SQL | parent_objective_id, okr_links, okr_collaborators, RLS, funcoes, trigger |
| Criado | `src/hooks/useOKRTree.ts` |
| Criado | `src/hooks/useOKRLinks.ts` |
| Criado | `src/hooks/useOKRCollaborators.ts` |
| Criado | `src/components/okr/OKRTreeView.tsx` |
| Criado | `src/pages/alignment/AlignmentView.tsx` |
| Modificado | `src/hooks/useObjectives.ts` (parent_objective_id) |
| Modificado | `src/pages/objectives/ObjectiveForm.tsx` (seletor de pai + colaboradores) |
| Modificado | `src/pages/objectives/ObjectiveDetail.tsx` (breadcrumb + links + colaboradores) |
| Modificado | `src/App.tsx` (rota /alignment) |
| Modificado | `src/components/layout/AppSidebar.tsx` (menu Alinhamento) |

---

### Ordem de execucao

1. Migracao SQL (coluna, tabelas, RLS, funcoes, triggers)
2. Atualizar useObjectives com parent_objective_id
3. Criar hooks useOKRTree, useOKRLinks, useOKRCollaborators
4. Atualizar ObjectiveForm com seletor de pai e colaboradores
5. Atualizar ObjectiveDetail com breadcrumb, links e colaboradores
6. Criar componente OKRTreeView
7. Criar pagina AlignmentView
8. Atualizar App.tsx e AppSidebar com nova rota

---

### Detalhes tecnicos

**Estrutura de arvore no cliente:**
```text
buildTree(objectives[]) -> TreeNode[]
  TreeNode = { objective, children: TreeNode[] }
  - Filtra objetivos raiz (parent_objective_id = null)
  - Recursivamente agrupa filhos
```

**CTE recursiva para ancestrais:**
```text
get_objective_ancestors(id):
  WITH RECURSIVE ancestors AS (
    SELECT * FROM objectives WHERE id = $1
    UNION ALL
    SELECT o.* FROM objectives o
    JOIN ancestors a ON o.id = a.parent_objective_id
  )
  SELECT * FROM ancestors ORDER BY created_at
```

**Prevencao de ciclos:**
```text
prevent_circular_parent trigger:
  IF NEW.parent_objective_id IS NULL THEN RETURN NEW
  Percorre cadeia de pais via loop
  Se encontrar NEW.id na cadeia -> RAISE EXCEPTION
```

