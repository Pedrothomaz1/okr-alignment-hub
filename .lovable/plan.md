

## Proposta: Sistema de Permissões Granular (RBAC + Permissões por Recurso)

### Contexto Atual

O projeto já possui 4 papéis (`admin`, `okr_master`, `manager`, `member`) e tabelas `permissions` e `role_permissions` no banco, mas elas não estão sendo usadas no frontend. A proposta é ativar e expandir esse sistema já existente.

### Modelo Proposto (Boas Práticas de Mercado)

A abordagem recomendada é **RBAC com permissões granulares por recurso e ação**, similar ao que produtos como Jira, Linear e Notion utilizam:

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  user_roles  │────▶│ role_permissions  │────▶│   permissions   │
│  (user,role) │     │ (role,permission) │     │ (key,description│
└─────────────┘     └──────────────────┘     └─────────────────┘
```

**Permissões propostas (agrupadas por módulo):**

| Módulo | Permissão (key) | Admin | OKR Master | Manager | Member |
|---|---|---|---|---|---|
| **Ciclos** | `cycles.create` | ✅ | ✅ | ❌ | ❌ |
| | `cycles.edit` | ✅ | ✅ | ❌ | ❌ |
| | `cycles.delete` | ✅ | ❌ | ❌ | ❌ |
| | `cycles.approve` | ✅ | ❌ | ❌ | ❌ |
| **Objetivos** | `objectives.create` | ✅ | ✅ | ✅ | ✅ |
| | `objectives.edit_any` | ✅ | ✅ | ❌ | ❌ |
| | `objectives.delete` | ✅ | ❌ | ❌ | ❌ |
| **Key Results** | `kr.create` | ✅ | ✅ | ✅ | ✅ |
| | `kr.checkin_any` | ✅ | ✅ | ❌ | ❌ |
| | `kr.delete` | ✅ | ❌ | ❌ | ❌ |
| **Iniciativas** | `initiatives.create` | ✅ | ✅ | ❌ | ❌ |
| | `initiatives.edit_any` | ✅ | ✅ | ❌ | ❌ |
| | `initiatives.delete` | ✅ | ❌ | ❌ | ❌ |
| **Usuários** | `users.invite` | ✅ | ❌ | ❌ | ❌ |
| | `users.manage_roles` | ✅ | ❌ | ❌ | ❌ |
| | `users.edit_profile_any` | ✅ | ❌ | ❌ | ❌ |
| | `users.view_sensitive` | ✅ | ❌ | ❌ | ❌ |
| **Relatórios** | `reports.view` | ✅ | ✅ | ✅ | ❌ |
| | `reports.export` | ✅ | ✅ | ❌ | ❌ |
| **Admin** | `admin.audit_logs` | ✅ | ❌ | ❌ | ❌ |
| | `admin.change_requests` | ✅ | ❌ | ❌ | ❌ |
| | `admin.settings` | ✅ | ❌ | ❌ | ❌ |
| **Engajamento** | `ppp.view_team` | ✅ | ❌ | ✅ | ❌ |
| | `pulse.view_team` | ✅ | ❌ | ✅ | ❌ |
| | `kudos.delete_any` | ✅ | ❌ | ❌ | ❌ |

**Nota:** Membros e managers sempre podem editar/fazer check-in nos seus próprios itens (ownership). As permissões `*_any` se referem a itens de outros usuários.

### Plano de Implementação

**1. Seed das permissões e role_permissions**
- Inserir as ~23 permissões na tabela `permissions` (já existe)
- Inserir os mapeamentos na tabela `role_permissions` (já existe)
- Usar a ferramenta de insert (não migration, pois são dados)

**2. Criar hook `usePermissions`**
- Busca as permissões do usuário logado via join `user_roles → role_permissions → permissions`
- Expõe `can("cycles.create")` como API simples
- Cache com React Query

**3. Criar componente `<Can>`**
- Componente declarativo: `<Can do="initiatives.delete">...</Can>`
- Esconde elementos da UI se o usuário não tiver permissão

**4. Atualizar o frontend**
- Substituir verificações `isAdmin` / `hasRole` espalhadas pelo código por `can("permission.key")`
- Atualizar sidebar, botões de ação, formulários e rotas protegidas

**5. Criar tela de gestão de permissões (Admin)**
- Matriz visual role × permission com toggles
- Permite que o admin customize quais permissões cada papel tem

### Detalhes Técnicos

- As tabelas `permissions` e `role_permissions` já existem com RLS adequado
- Função DB `has_role` continua sendo usada nas policies RLS (camada de segurança no banco)
- O frontend adiciona uma camada de UX sobre isso, escondendo ações que o usuário não pode fazer
- Nenhuma mudança de schema necessária — apenas dados e código frontend

