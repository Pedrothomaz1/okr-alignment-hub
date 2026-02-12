

## Fase 8: Completar Cycles & Governance

Implementar o fluxo de aprovacao de ciclos, locks de edicao e historico de regras conforme o PRD.

---

### Resumo do que sera construido

1. **Duas novas tabelas** no banco: `cycle_requests` (pedidos de aprovacao) e `cycle_rules_history` (historico de mudancas de regras)
2. **RLS** para as novas tabelas
3. **Funcoes de banco** para aprovar/rejeitar ciclos e aplicar locks
4. **Trigger** que aplica lock automaticamente quando ciclo muda para "active"
5. **Hook `useCycleRequests`** para gerenciar pedidos de aprovacao
6. **UI de aprovacao** na pagina de detalhe do ciclo
7. **Atualizacao do formulario** para incluir regras (lock_after_start)
8. **Restricao de edicao** quando ciclo estiver locked

---

### Etapa 1 -- Migracao de banco de dados

Criar tabelas e funcoes via migracao SQL:

**Tabela `cycle_requests`:**
- `id` UUID PK
- `cycle_id` UUID FK -> cycles.id
- `requested_by` UUID (quem pediu aprovacao)
- `approver_id` UUID (nullable, quem decidiu)
- `status` TEXT (pending, approved, rejected)
- `comment` TEXT
- `created_at` timestamptz
- `decision_at` timestamptz
- `decision_by` UUID

**Tabela `cycle_rules_history`:**
- `id` UUID PK
- `cycle_id` UUID FK -> cycles.id
- `rule_changes` JSONB
- `changed_by` UUID
- `created_at` timestamptz

**Coluna nova em `cycles`:**
- Adicionar campo `locked` BOOLEAN DEFAULT false na tabela cycles

**RLS para `cycle_requests`:**
- SELECT: requester, approver ou admins
- INSERT: admin ou okr_master
- UPDATE: apenas admins (para decisao)

**RLS para `cycle_rules_history`:**
- SELECT: admin ou okr_master
- INSERT: via trigger/service

**Funcao `decide_cycle_request`:**
- Recebe request_id, decision (approved/rejected), comment, approver_id
- Atualiza cycle_requests e muda status do ciclo
- Insere audit_log

**Trigger em cycles:**
- AFTER UPDATE quando status muda para 'active': seta `locked = true` se metadata contem lock_after_start

**Trigger de auditoria** nas novas tabelas (reutilizar `audit_trigger_fn` existente)

---

### Etapa 2 -- Hook `useCycleRequests`

**Novo arquivo: `src/hooks/useCycleRequests.ts`**

- Query para listar requests de um ciclo
- Mutation `createRequest` -- insere pedido de aprovacao com status "pending"
- Mutation `decideRequest` -- chama a funcao `decide_cycle_request` via RPC
- Invalida queries de cycles e cycle_requests no sucesso

---

### Etapa 3 -- Atualizar CycleForm

**Arquivo: `src/pages/cycles/CycleForm.tsx`**

- Adicionar checkbox "Travar edicoes apos ativacao" (lock_after_start) que sera salvo no campo `metadata` do ciclo
- Adicionar status "pending_approval" como opcao (visivel apenas para admin/okr_master)
- Quando ciclo esta `locked`, desabilitar edicao dos campos

---

### Etapa 4 -- UI de Aprovacao no CycleDetail

**Arquivo: `src/pages/cycles/CycleDetail.tsx`**

- Novo card "Aprovacoes" mostrando lista de requests com status, comentarios e datas
- Botao "Solicitar Aprovacao" (visivel para admin/okr_master quando ciclo esta em draft)
- Botoes "Aprovar" e "Rejeitar" com modal de comentario (visivel para admins em requests pendentes)
- Indicador visual de lock (icone de cadeado) quando ciclo esta travado
- Desabilitar botao de editar ciclo quando `locked = true`

---

### Etapa 5 -- Novo componente CycleApprovalCard

**Novo arquivo: `src/components/cycles/CycleApprovalCard.tsx`**

- Recebe cycle_id e lista de requests
- Renderiza timeline de requests (pendente, aprovado, rejeitado) com avatar do ator e data
- Modal para "Aprovar" ou "Rejeitar" com campo de comentario
- Botao "Solicitar Aprovacao" que cria novo request

---

### Etapa 6 -- Restricao de edicao em OKRs de ciclos locked

**Arquivo: `src/pages/objectives/ObjectiveDetail.tsx`**

- Verificar se o ciclo pai esta `locked`
- Se locked, esconder botoes de criar/editar KRs e objetivos
- Mostrar aviso "Ciclo travado -- solicite change request para alteracoes"

---

### Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Migracao SQL | Nova migracao (cycle_requests, cycle_rules_history, coluna locked, RLS, funcoes, triggers) |
| Criado | `src/hooks/useCycleRequests.ts` |
| Criado | `src/components/cycles/CycleApprovalCard.tsx` |
| Modificado | `src/pages/cycles/CycleDetail.tsx` |
| Modificado | `src/pages/cycles/CycleForm.tsx` |
| Modificado | `src/hooks/useCycles.ts` (adicionar campo locked na interface) |
| Modificado | `src/pages/objectives/ObjectiveDetail.tsx` (restricao de edicao) |
| Modificado | `src/integrations/supabase/types.ts` (atualizado automaticamente) |

---

### Ordem de execucao

1. Migracao SQL (tabelas, RLS, funcoes, triggers)
2. Hook useCycleRequests
3. Componente CycleApprovalCard
4. Atualizar CycleDetail com card de aprovacoes e indicador de lock
5. Atualizar CycleForm com checkbox lock_after_start e status pending_approval
6. Atualizar useCycles interface com campo locked
7. Atualizar ObjectiveDetail com restricao de edicao para ciclos locked

