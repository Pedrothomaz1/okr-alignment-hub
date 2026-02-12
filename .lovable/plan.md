
## Fase 8: Completar Cycles & Governance ✅

Implementado:
1. Tabelas `cycle_requests` e `cycle_rules_history` com RLS
2. Coluna `locked` em `cycles`
3. Função `decide_cycle_request` (SECURITY DEFINER)
4. Trigger `lock_cycle_on_active` (auto-lock quando status → active com lock_after_start)
5. Triggers de auditoria nas novas tabelas
6. Hook `useCycleRequests` com createRequest e decideRequest (RPC)
7. Componente `CycleApprovalCard` com timeline e modal de decisão
8. CycleDetail atualizado com card de aprovações e indicador de lock
9. CycleForm atualizado com checkbox lock_after_start e bloqueio de edição quando locked
10. ObjectiveDetail com restrição de edição para ciclos locked
