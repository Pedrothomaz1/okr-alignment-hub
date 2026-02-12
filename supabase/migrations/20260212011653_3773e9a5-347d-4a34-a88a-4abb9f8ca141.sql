
-- Table for KR check-in history
CREATE TABLE public.kr_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  value numeric NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kr_checkins_kr_id_created ON public.kr_checkins (key_result_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.kr_checkins ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated
CREATE POLICY "Authenticated can view checkins"
  ON public.kr_checkins FOR SELECT
  USING (true);

-- INSERT: admin, okr_master, or KR owner
CREATE POLICY "Admin/OKR master/KR owner can insert checkins"
  ON public.kr_checkins FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.key_results
      WHERE id = key_result_id AND owner_id = auth.uid()
    )
  );

-- DELETE: admin only
CREATE POLICY "Admin can delete checkins"
  ON public.kr_checkins FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to sync KR current_value on check-in insert
CREATE OR REPLACE FUNCTION public.sync_kr_value_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.key_results
  SET current_value = NEW.value
  WHERE id = NEW.key_result_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_kr_value_on_checkin
  AFTER INSERT ON public.kr_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_kr_value_on_checkin();

-- Audit trigger
CREATE TRIGGER audit_kr_checkins
  AFTER INSERT OR UPDATE OR DELETE ON public.kr_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_fn();
