-- Add weight column to key_results
ALTER TABLE public.key_results ADD COLUMN weight numeric NOT NULL DEFAULT 1;

-- Recreate update_objective_progress() to use weighted average
CREATE OR REPLACE FUNCTION public.update_objective_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _objective_id UUID;
  _weighted_progress INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _objective_id := OLD.objective_id;
  ELSE
    _objective_id := NEW.objective_id;
  END IF;

  SELECT COALESCE(
    ROUND(
      SUM(
        CASE
          WHEN target_value - start_value = 0 THEN 0
          ELSE LEAST(100, GREATEST(0, ((current_value - start_value) / (target_value - start_value)) * 100)) * weight
        END
      ) / NULLIF(SUM(weight), 0)
    )::INTEGER, 0)
  INTO _weighted_progress
  FROM public.key_results
  WHERE objective_id = _objective_id;

  UPDATE public.objectives
  SET progress = _weighted_progress
  WHERE id = _objective_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;