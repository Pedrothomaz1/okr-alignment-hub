
-- =============================================
-- OBJECTIVES TABLE
-- =============================================
CREATE TABLE public.objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'on_track',
  progress INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_objectives_cycle_id ON public.objectives(cycle_id);
CREATE INDEX idx_objectives_owner_id ON public.objectives(owner_id);
CREATE INDEX idx_objectives_status ON public.objectives(status);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view objectives"
  ON public.objectives FOR SELECT
  USING (true);

CREATE POLICY "Admin/OKR master/owner can create objectives"
  ON public.objectives FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

CREATE POLICY "Admin/OKR master/owner can update objectives"
  ON public.objectives FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

CREATE POLICY "Admin can delete objectives"
  ON public.objectives FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_objectives
  AFTER INSERT OR UPDATE OR DELETE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- =============================================
-- KEY RESULTS TABLE
-- =============================================
CREATE TABLE public.key_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  kr_type TEXT NOT NULL DEFAULT 'percentage',
  start_value NUMERIC NOT NULL DEFAULT 0,
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'on_track',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_key_results_objective_id ON public.key_results(objective_id);
CREATE INDEX idx_key_results_owner_id ON public.key_results(owner_id);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view key_results"
  ON public.key_results FOR SELECT
  USING (true);

CREATE POLICY "Admin/OKR master/owner can create key_results"
  ON public.key_results FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

CREATE POLICY "Admin/OKR master/owner can update key_results"
  ON public.key_results FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

CREATE POLICY "Admin can delete key_results"
  ON public.key_results FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_key_results
  AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- =============================================
-- AUTO-UPDATE OBJECTIVE PROGRESS FROM KEY RESULTS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_objective_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _objective_id UUID;
  _avg_progress INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _objective_id := OLD.objective_id;
  ELSE
    _objective_id := NEW.objective_id;
  END IF;

  SELECT COALESCE(
    ROUND(AVG(
      CASE
        WHEN target_value - start_value = 0 THEN 0
        ELSE LEAST(100, GREATEST(0, ((current_value - start_value) / (target_value - start_value)) * 100))
      END
    ))::INTEGER, 0)
  INTO _avg_progress
  FROM public.key_results
  WHERE objective_id = _objective_id;

  UPDATE public.objectives
  SET progress = _avg_progress
  WHERE id = _objective_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_objective_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_objective_progress();

-- =============================================
-- ENABLE REALTIME ON KEY RESULTS
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.key_results;
