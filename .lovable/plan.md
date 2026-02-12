

## Fase 10: Change Requests para Ciclos Travados

Permitir que usuarios solicitem alteracoes em ciclos travados (locked), com fluxo de aprovacao por admins antes da edicao ser aplicada.

---

### Contexto

Hoje, quando um ciclo esta travado (`locked = true`), a UI impede qualquer edicao em objetivos e KRs vinculados. Esta fase adiciona um mecanismo formal para que usuarios solicitem excecoes (change requests), que precisam ser aprovadas por um admin antes de serem efetivadas.

---

### O que sera construido

1. **Tabela `change_requests`** para registrar pedidos de alteracao em ciclos travados
2. **RLS** para a nova tabela
3. **Funcao `decide_change_request`** para aprovar/rejeitar pedidos
4. **Hook `useChangeRequests`** para gerenciar pedidos
5. **Componente `ChangeRequestCard`** para exibir e gerenciar pedidos
6. **Integracao no ObjectiveDetail** -- botao "Solicitar Alteracao" quando ciclo esta locked
7. **Pagina de Change Requests** acessivel pelo admin (listagem geral)
8. **Desbloqueio temporario** -- quando aprovado, permite edicao do objetivo/KR por tempo limitado

---

### Etapa 1 -- Migracao de banco de dados

**Tabela `change_requests`:**
- `id` UUID PK default gen_random_uuid()
- `cycle_id` UUID FK -> cycles.id
- `objective_id` UUID FK -> objectives.id (nullable)
- `requested_by` UUID (quem pediu)
- `request_type` TEXT (`edit_objective`, `edit_kr`, `add_kr`, `delete_kr`)
- `description` TEXT (justificativa do pedido)
- `status` TEXT default 'pending' (`pending`, `approved`, `rejected`, `expired`)
- `decision_by` UUID (nullable)
- `decision_comment` TEXT (nullable)
- `decision_at` timestamptz (nullable)
- `expires_at` timestamptz (nullable) -- janela de edicao apos aprovacao
- `created_at` timestamptz default now()

**RLS para `change_requests`:**
- SELECT: requester, admin ou okr_master
- INSERT: qualquer usuario autenticado (desde que o ciclo esteja locked)
- UPDATE: apenas admins (para decisao)
- DELETE: apenas admins

**Funcao `decide_change_request(_request_id UUID, _decision TEXT, _comment TEXT)`:**
- Atualiza status, decision_by, decision_comment, decision_at
- Se aprovado, define expires_at = now() + interval '24 hours'
- Insere registro em audit_logs
- Usa SECURITY DEFINER para garantir permissoes

**Trigger de auditoria** na tabela change_requests reutilizando `audit_trigger_fn`

---

### Etapa 2 -- Hook `useChangeRequests`

**Novo arquivo: `src/hooks/useChangeRequests.ts`**

- Query para listar change requests de um objetivo ou ciclo
- Query para listar todos os change requests (para visao admin)
- Mutation `createChangeRequest` -- insere pedido com status "pending"
- Mutation `decideChangeRequest` -- chama `decide_change_request` via RPC
- Funcao helper `hasActiveApproval(objectiveId)` -- verifica se existe change request aprovado e nao expirado para o objetivo

---

### Etapa 3 -- Componente ChangeRequestCard

**Novo arquivo: `src/components/cycles/ChangeRequestCard.tsx`**

- Recebe objective_id ou cycle_id
- Renderiza lista de change requests com status (pendente/aprovado/rejeitado/expirado)
- Para admins: botoes "Aprovar" e "Rejeitar" com modal de comentario
- Para usuarios: botao "Solicitar Alteracao" com campo de justificativa e tipo de request
- Indicador de tempo restante para requests aprovados (countdown ate expires_at)

---

### Etapa 4 -- Atualizar ObjectiveDetail

**Arquivo: `src/pages/objectives/ObjectiveDetail.tsx`**

Logica atual: quando ciclo esta locked, esconde botao "Novo KR" e mostra alerta.

Nova logica:
- Verificar se existe change request aprovado e nao expirado para o objetivo
- Se sim: permitir edicao normalmente + mostrar banner "Edicao temporaria aprovada (expira em X horas)"
- Se nao: manter botao "Solicitar Alteracao" no lugar do alerta atual
- Adicionar secao com lista de change requests do objetivo (usando ChangeRequestCard)

---

### Etapa 5 -- Pagina admin de Change Requests

**Novo arquivo: `src/pages/admin/ChangeRequests.tsx`**

- Listagem de todos os change requests do sistema
- Filtros: por status, por ciclo
- Acoes rapidas de aprovar/rejeitar em lote
- Link para o objetivo/ciclo relacionado

**Atualizacoes:**
- `src/App.tsx`: rota `/admin/change-requests`
- `src/components/layout/AppSidebar.tsx`: item "Change Requests" no grupo Administracao

---

### Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Migracao SQL | change_requests, RLS, funcao decide_change_request, trigger auditoria |
| Criado | `src/hooks/useChangeRequests.ts` |
| Criado | `src/components/cycles/ChangeRequestCard.tsx` |
| Criado | `src/pages/admin/ChangeRequests.tsx` |
| Modificado | `src/pages/objectives/ObjectiveDetail.tsx` (desbloqueio temporario + UI de change request) |
| Modificado | `src/App.tsx` (rota /admin/change-requests) |
| Modificado | `src/components/layout/AppSidebar.tsx` (menu Change Requests) |

---

### Ordem de execucao

1. Migracao SQL (tabela, RLS, funcao, trigger)
2. Criar hook useChangeRequests
3. Criar componente ChangeRequestCard
4. Atualizar ObjectiveDetail com logica de desbloqueio temporario
5. Criar pagina admin ChangeRequests
6. Atualizar App.tsx e AppSidebar com nova rota

---

### Detalhes tecnicos

**Logica de desbloqueio temporario no ObjectiveDetail:**
```text
const hasActiveApproval = changeRequests.some(
  cr => cr.status === 'approved'
    && cr.objective_id === objectiveId
    && cr.expires_at
    && new Date(cr.expires_at) > new Date()
);

// Se hasActiveApproval: mostrar botoes de edicao normalmente
// Se nao e ciclo locked: mostrar botao "Solicitar Alteracao"
```

**Funcao decide_change_request:**
```text
decide_change_request(_request_id, _decision, _comment):
  UPDATE change_requests SET
    status = _decision,
    decision_by = auth.uid(),
    decision_comment = _comment,
    decision_at = now(),
    expires_at = CASE WHEN _decision = 'approved'
                 THEN now() + interval '24 hours'
                 ELSE NULL END
  WHERE id = _request_id AND status = 'pending'
```

