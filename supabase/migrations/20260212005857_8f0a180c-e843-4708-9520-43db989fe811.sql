
-- Create cycles table
CREATE TABLE public.cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cycles_status ON public.cycles(status);
CREATE INDEX idx_cycles_dates ON public.cycles(start_date, end_date);
CREATE INDEX idx_cycles_created_by ON public.cycles(created_by);

-- Enable RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users
CREATE POLICY "Authenticated can view cycles"
  ON public.cycles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin or okr_master
CREATE POLICY "Admin/OKR master can create cycles"
  ON public.cycles FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- UPDATE: admin or okr_master
CREATE POLICY "Admin/OKR master can update cycles"
  ON public.cycles FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- DELETE: admin only
CREATE POLICY "Admin can delete cycles"
  ON public.cycles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_cycles
  AFTER INSERT OR UPDATE OR DELETE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_fn();

-- Date validation trigger
CREATE OR REPLACE FUNCTION public.validate_cycle_dates()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  IF NEW.end_date <= NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be after start_date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_cycle_dates_trigger
  BEFORE INSERT OR UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cycle_dates();
