

# Destravar o ciclo "Q1 2026 - Teste Travado"

## Situação atual
O ciclo `aaaaaaaa-0001-0001-0001-000000000001` está com `locked = true` e `status = active`.

## Plano
Executar uma migration que:
1. Seta `locked = false` no ciclo
2. Remove o `lock_after_start` do metadata para que ele não trave novamente automaticamente ao reativar

```sql
UPDATE cycles
SET locked = false,
    metadata = metadata - 'lock_after_start'
WHERE id = 'aaaaaaaa-0001-0001-0001-000000000001';
```

Isso permitirá editar OKRs, redistribuir pesos dos KRs e testar os sliders interativamente.

