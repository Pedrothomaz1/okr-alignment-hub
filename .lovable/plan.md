

## Propagação Hierárquica de Progresso de Objetivos

### Problema Atual
O trigger `update_objective_progress` calcula o progresso de um objetivo apenas pela média ponderada dos seus KRs diretos. Objetivos pai não refletem o progresso dos objetivos filhos.

### Solução

**1. Criar função recursiva no banco de dados**

Uma nova função `calculate_objective_progress_recursive` que:
- Calcula a média ponderada dos KRs diretos do objetivo
- Busca todos os objetivos filhos (`parent_objective_id = objetivo atual`)
- Combina o progresso dos KRs com o progresso dos filhos
- Atualiza o objetivo e **propaga para cima** até a raiz da árvore

**2. Atualizar o trigger existente**

Modificar o trigger `update_objective_progress` para, após calcular o progresso do objetivo com base nos KRs, disparar a recalculação do objetivo pai (se existir), propagando a mudança até o topo da hierarquia.

**3. Criar trigger adicional para mudanças de parent_objective_id**

Quando um objetivo muda de pai (ou ganha/perde um pai), os progressos dos pais antigo e novo precisam ser recalculados.

### Lógica de cálculo

Para cada objetivo:
- **Se tem apenas KRs**: progresso = média ponderada dos KRs (já funciona)
- **Se tem apenas filhos**: progresso = média simples do progresso dos filhos
- **Se tem KRs + filhos**: progresso = média ponderada onde KRs contribuem com seus pesos e cada filho contribui com peso 1 (ou configurável)

### Migração SQL

```sql
-- Função recursiva que recalcula progresso de um objetivo e propaga para o pai
CREATE OR REPLACE FUNCTION public.recalc_objective_progress(_objective_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kr_weighted_sum NUMERIC := 0;
  _kr_weight_total NUMERIC := 0;
  _child_progress_sum NUMERIC := 0;
  _child_count INTEGER := 0;
  _final_progress INTEGER := 0;
  _parent_id UUID;
BEGIN
  -- KRs diretos
  SELECT COALESCE(SUM(
    CASE WHEN target_value - start_value = 0 THEN 0
    ELSE LEAST(100, GREATEST(0, ((current_value - start_value)::numeric / (target_value - start_value)) * 100)) * weight
    END
  ), 0),
  COALESCE(SUM(weight), 0)
  INTO _kr_weighted_sum, _kr_weight_total
  FROM public.key_results WHERE objective_id = _objective_id;

  -- Filhos diretos
  SELECT COUNT(*), COALESCE(SUM(progress), 0)
  INTO _child_count, _child_progress_sum
  FROM public.objectives WHERE parent_objective_id = _objective_id;

  -- Combinar: KRs (com peso) + filhos (peso 1 cada)
  IF _kr_weight_total > 0 AND _child_count > 0 THEN
    _final_progress := ROUND((_kr_weighted_sum + _child_progress_sum) / (_kr_weight_total + _child_count))::INTEGER;
  ELSIF _kr_weight_total > 0 THEN
    _final_progress := ROUND(_kr_weighted_sum / _kr_weight_total)::INTEGER;
  ELSIF _child_count > 0 THEN
    _final_progress := ROUND(_child_progress_sum / _child_count)::INTEGER;
  ELSE
    _final_progress := 0;
  END IF;

  UPDATE public.objectives SET progress = _final_progress WHERE id = _objective_id;

  -- Propagar para o pai
  SELECT parent_objective_id INTO _parent_id FROM public.objectives WHERE id = _objective_id;
  IF _parent_id IS NOT NULL THEN
    PERFORM public.recalc_objective_progress(_parent_id);
  END IF;
END;
$$;
```

Substituir o trigger `update_objective_progress` para chamar `recalc_objective_progress` em vez de fazer o cálculo isolado, e adicionar trigger em `objectives` para quando `progress` ou `parent_objective_id` mudar, propagar para o pai.

### Arquivos afetados
- **Migração SQL**: novo arquivo em `supabase/migrations/` com a função e triggers atualizados
- **Nenhuma mudança no frontend** — o campo `progress` já é lido e exibido corretamente

