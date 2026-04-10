
-- 1. Criar função recursiva de recálculo de progresso
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

-- 2. Substituir a função do trigger de KRs para usar recalc_objective_progress
CREATE OR REPLACE FUNCTION public.update_objective_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _objective_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _objective_id := OLD.objective_id;
  ELSE
    _objective_id := NEW.objective_id;
  END IF;

  PERFORM public.recalc_objective_progress(_objective_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger para propagar quando progress ou parent_objective_id mudam em objectives
CREATE OR REPLACE FUNCTION public.propagate_objective_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Quando parent_objective_id muda, recalcular pai antigo e novo
  IF OLD.parent_objective_id IS DISTINCT FROM NEW.parent_objective_id THEN
    IF OLD.parent_objective_id IS NOT NULL THEN
      PERFORM public.recalc_objective_progress(OLD.parent_objective_id);
    END IF;
    IF NEW.parent_objective_id IS NOT NULL THEN
      PERFORM public.recalc_objective_progress(NEW.parent_objective_id);
    END IF;
  -- Quando progress muda (por recalc), propagar para o pai
  ELSIF OLD.progress IS DISTINCT FROM NEW.progress AND NEW.parent_objective_id IS NOT NULL THEN
    PERFORM public.recalc_objective_progress(NEW.parent_objective_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Dropar trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS propagate_objective_progress_trigger ON public.objectives;
CREATE TRIGGER propagate_objective_progress_trigger
  AFTER UPDATE OF progress, parent_objective_id ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_objective_progress();

-- Trigger para quando um objetivo filho é deletado, recalcular o pai
CREATE OR REPLACE FUNCTION public.recalc_parent_on_objective_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.parent_objective_id IS NOT NULL THEN
    PERFORM public.recalc_objective_progress(OLD.parent_objective_id);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS recalc_parent_on_objective_delete_trigger ON public.objectives;
CREATE TRIGGER recalc_parent_on_objective_delete_trigger
  AFTER DELETE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_parent_on_objective_delete();
