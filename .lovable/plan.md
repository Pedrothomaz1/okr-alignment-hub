

## Problema Identificado

A variável `canEdit` na página `ObjectiveDetail` verifica apenas se o **ciclo está travado**, mas **não verifica se o usuário é o dono** do objetivo ou KR. Isso significa que qualquer usuário logado pode ver os botões de editar, criar KRs e fazer check-ins em objetivos de outros usuários.

O mesmo acontece no `CheckinTimeline` — o formulário de check-in é exibido para todos, sem verificar se o usuário é dono do KR.

A RLS no banco **já protege** contra alterações indevidas (só owner, admin ou okr_master podem atualizar), mas a UI não esconde os botões, causando erros silenciosos ou mensagens confusas.

---

## Matriz de Permissões por Perfil

| Ação | member | manager | okr_master | admin |
|---|---|---|---|---|
| **Ver** objetivos/KRs | ✅ todos | ✅ todos | ✅ todos | ✅ todos |
| **Criar** objetivo | ✅ próprio | ✅ próprio | ✅ qualquer | ✅ qualquer |
| **Editar** objetivo | ✅ só próprio | ✅ só próprio | ✅ qualquer | ✅ qualquer |
| **Deletar** objetivo | ❌ | ❌ | ❌ | ✅ qualquer |
| **Criar** KR | ✅ em obj próprio | ✅ em obj próprio | ✅ qualquer | ✅ qualquer |
| **Editar** KR | ✅ só próprio | ✅ só próprio | ✅ qualquer | ✅ qualquer |
| **Deletar** KR | ❌ | ❌ | ❌ | ✅ qualquer |
| **Check-in** em KR | ✅ só próprio | ✅ só próprio | ✅ qualquer | ✅ qualquer |
| **Criar/gerenciar** ciclos | ❌ | ❌ | ✅ | ✅ |
| **Convidar** usuários | ❌ | ❌ | ❌ | ✅ |
| **Gerenciar** roles | ❌ | ❌ | ❌ | ✅ |
| **Ver** audit logs | ❌ | ❌ | ❌ | ✅ |
| **Ver** PPP subordinados | ❌ | ✅ (subordinados) | ❌ | ✅ todos |
| **Ver** Pulse subordinados | ❌ | ✅ (subordinados) | ❌ | ✅ todos |

---

## Plano de Correção

### 1. Corrigir `ObjectiveDetail.tsx` — restringir `canEdit` por ownership/role

- Importar `useAuth` e `useRoles`
- Alterar `canEdit` para:
  ```
  const isOwner = user?.id === obj?.owner_id;
  const isPrivileged = isAdmin || hasRole('okr_master');
  const canEditObj = (isOwner || isPrivileged) && (!isCycleLocked || activeApproval);
  ```
- Usar `canEditObj` para mostrar/esconder botão "Editar" e "Novo KR"
- Passar informação de ownership para `KeyResultCard` para controlar botão editar

### 2. Corrigir `KeyResultCard.tsx` — aceitar prop `canEdit`

- Adicionar prop `canEdit` ao componente
- Só mostrar botão de editar (ícone lápis) quando `canEdit` é true

### 3. Corrigir `ObjectiveDetail.tsx` — passar `canEdit` por KR

- Para cada KR, calcular se o usuário pode editar:
  ```
  const canEditKr = (kr) => kr.owner_id === user?.id || isPrivileged;
  ```
- Passar para `KeyResultCard` via prop

### 4. Corrigir `CheckinTimeline.tsx` — restringir formulário de check-in

- Adicionar prop `canCheckin` ao componente
- Só mostrar o formulário de novo check-in quando `canCheckin` é true
- Atualizar `KeyResultCard` para passar essa prop baseada na mesma lógica de ownership

### 5. Corrigir `WeightDistributor` — restringir por role

- Só mostrar o distribuidor de pesos para owner do objetivo ou roles privilegiados

---

## Arquivos Alterados

1. **`src/pages/objectives/ObjectiveDetail.tsx`** — lógica de permissão com ownership + roles
2. **`src/components/okr/KeyResultCard.tsx`** — prop `canEdit` e `canCheckin`
3. **`src/components/okr/CheckinTimeline.tsx`** — prop `canCheckin` para esconder formulário

