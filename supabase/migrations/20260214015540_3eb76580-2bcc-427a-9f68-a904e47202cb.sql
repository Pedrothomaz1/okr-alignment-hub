
-- Trigger to update objective progress when key_results change
CREATE TRIGGER update_objective_progress_on_kr
AFTER INSERT OR UPDATE OF current_value, start_value, target_value OR DELETE
ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.update_objective_progress();
