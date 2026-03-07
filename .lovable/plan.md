

# Pesos nos Key Results

## Resumo
Adicionar um campo `weight` (peso) na tabela `key_results` e atualizar o formulário, card, hook e a function de cálculo de progresso do objetivo para usar média ponderada em vez de média simples.

## Mudanças

### 1. Migração de banco de dados
- Adicionar coluna `weight` (numeric, default 1, not null) na tabela `key_results`
- Recriar a function `update_objective_progress()` para calcular média ponderada: `SUM(progress_individual * weight) / SUM(weight)`

### 2. Hook `useKeyResults.ts`
- Adicionar `weight` à interface `KeyResult`
- Incluir `weight` nos parâmetros de `createKeyResult` e `updateKeyResult`

### 3. Formulário `KeyResultForm.tsx`
- Adicionar campo `weight` ao schema zod (number, default 1, min 0.01)
- Renderizar input de peso com label "Peso (%)" no formulário

### 4. Card `KeyResultCard.tsx`
- Exibir o peso do KR como badge ou texto discreto (ex: "Peso: 30%")

### 5. Detalhe do Objetivo `ObjectiveDetail.tsx`
- Exibir a distribuição de pesos dos KRs (opcional: aviso se soma != 100%)

## Lógica da média ponderada
A function `update_objective_progress()` será atualizada de:
```sql
AVG(progress_individual)
```
Para:
```sql
SUM(progress_individual * weight) / NULLIF(SUM(weight), 0)
```

O peso é flexível -- pode ser 20, 30, 25, 25 (somando 100) ou valores arbitrários como 1, 2, 1, 1 (proporcionais). O cálculo normaliza automaticamente.

