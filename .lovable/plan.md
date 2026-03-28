

## Reformular Iniciativas: Mensuração, Progresso, Bloqueio e Filtros

### Resumo das mudanças

A iniciativa passa a ter uma **unidade de medida** (R$, %, unidades, horas, **booleano**), um **valor-alvo** numérico e um **valor atual** (progresso). O status textual (pendente/concluída) é removido e passa a ser **calculado no front**. Após o prazo, edição é bloqueada. Filtros por **Unidade** e **Responsável**.

---

### 1. Migration: adicionar colunas na tabela `initiatives`

```sql
ALTER TABLE public.initiatives
  ADD COLUMN measurement_unit TEXT NOT NULL DEFAULT 'R$',
  ADD COLUMN target_value NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN current_value NUMERIC NOT NULL DEFAULT 0;
```

- `measurement_unit`: "R$", "%", "un", "horas", "bool"
- `target_value`: valor-alvo (para booleano: 1 = sim)
- `current_value`: progresso (para booleano: 0 ou 1)
- `status` e `expected_impact` permanecem no banco por compatibilidade, mas deixam de ser usados na UI

### 2. Atualizar hook `useInitiatives`

Adicionar `measurement_unit`, `target_value`, `current_value` ao tipo `Initiative` e aos inserts/updates.

### 3. Reformular `InitiativeForm`

- Remover campo Status (select pendente/em andamento)
- Adicionar **Unidade de Medida** (select: R$, %, unidades, horas, booleano)
- **Impacto Esperado** vira input numérico formatado pela unidade; para booleano fica oculto (target_value = 1 automaticamente)
- **Valor Atual** aparece ao editar: input numérico ou toggle/switch para booleano
- Todo formulário bloqueado se `deadline < hoje`, com aviso "Prazo expirado"

### 4. Reformular `InitiativesList`

**Filtros** (barra acima da tabela):
- Select por **Unidade** (valores únicos das iniciativas existentes)
- Select por **Dono/Responsável** (perfis)

**Tabela**:
- Coluna "Impacto Esperado" → valor-alvo formatado (ex: "R$ 100.000,00", "Sim/Não")
- Coluna "Status" → valor atual formatado + barra de progresso; para booleano mostra check/X
- Cores: verde (atingiu), amarelo (em progresso), vermelho (expirou sem atingir)
- Botão editar desabilitado se prazo expirou

**Status calculado no front:**
- `current_value >= target_value` → Concluída (verde)
- `deadline < hoje` e não concluída → Expirada (vermelho)
- Caso contrário → Em andamento (azul)

### 5. Formatação por unidade

| Unidade | Impacto Esperado | Valor Atual |
|---------|-----------------|-------------|
| R$ | R$ 100.000,00 | R$ 80.000,00 |
| % | 100% | 80% |
| un | 150 un | 120 un |
| horas | 40 horas | 30 horas |
| bool | — | Switch Sim/Não |

---

### Arquivos modificados
- **Migration SQL** — adicionar 3 colunas
- `src/hooks/useInitiatives.ts` — novos campos no tipo
- `src/pages/initiatives/InitiativeForm.tsx` — reformulação completa
- `src/pages/initiatives/InitiativesList.tsx` — filtros + nova visualização

