---
name: Business Units
description: Multi-BU access control - users see only their assigned BUs (admin/okr_master see all)
type: feature
---
- Tabelas: `business_units` (CRUD admin) + `user_business_units` (N:N admin-managed)
- Colunas BU: `cycles.business_unit_id`, `objectives.business_unit_id`, `initiatives.business_unit_id` (nullable = corporativo, visível a todos)
- KRs herdam BU do objetivo (sem coluna)
- RLS via `user_can_see_bu(uid, bu_id)`: true se admin/okr_master, BU=null, ou usuário pertence à BU
- Engajamento (PPP/Pulse/Kudos) via `user_shares_bu(viewer, target)`: admin/okr_master tudo, ou compartilham ao menos uma BU, ou target sem BU
- Permissões RBAC: `business_units.manage`, `business_units.assign` (admin)
- Admin UI: `/admin/business-units` (CRUD), card em `/admin/users/:id` para vincular BUs
- Forms (Cycle, Objective, Initiative): campo BU opcional
- Filtros e badges: `BUFilter`, `BUSelectField`, `BUBadge` em `src/components/common/`
