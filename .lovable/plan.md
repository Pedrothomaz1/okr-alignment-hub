

## Diagnóstico: O que falta fazer

O sistema de permissões (RBAC) já tem infraestrutura montada — tabelas `permissions` e `role_permissions` existem, o hook `usePermissions` funciona, e 5 páginas já usam `can()`. **Porém, os mapeamentos de permissões estão incompletos**: quase tudo está atribuído apenas ao `admin`. Segundo o plano aprovado, faltam **11 atribuições de role_permissions**.

### 1. Corrigir mapeamentos de permissões (dados no banco)

Permissões que precisam ser adicionadas conforme o plano:

| Permissão | Role faltando |
|---|---|
| `initiatives.create` | `okr_master` |
| `initiatives.edit_any` | `okr_master` |
| `reports.view` | `okr_master`, `manager` |
| `reports.export` | `okr_master` |
| `ppp.view_team` | `manager` |
| `pulse.view_team` | `manager` |

**Como**: Uma migration SQL com INSERTs na tabela `role_permissions`.

### 2. Aplicar `<Can>` e `can()` em mais páginas

O componente `<Can>` existe mas **não é usado em nenhum lugar**. Apenas `can()` direto é usado em 5 arquivos. Falta proteger:

- **Sidebar**: Links de admin, relatórios (já parcial)
- **Dashboard Leader**: Acesso baseado em `can("reports.view")`
- **Admin pages** (AuditLogs, ChangeRequests, UsersRoles): Usar `<Can>` para esconder botões/ações
- **KudosPage**: Botão de deletar kudos de outros com `can("kudos.delete_any")`
- **WeeklyPPP / PulseSurvey**: Visualização de time com `can("ppp.view_team")` / `can("pulse.view_team")`

### 3. Proteger rotas com permissões

Atualmente `AdminRoute` verifica apenas role `admin`. Seria ideal criar um `PermissionRoute` que verifica uma permissão específica, para rotas como `/reports` e `/leader`.

### Resumo de escopo

| Tarefa | Tipo | Esforço |
|---|---|---|
| Inserir 11 role_permissions faltantes | Migration SQL | Pequeno |
| Usar `<Can>` / `can()` em ~8 páginas adicionais | Frontend | Médio |
| Criar `PermissionRoute` genérico | Frontend | Pequeno |

Nenhuma mudança de schema — apenas dados e código frontend.

