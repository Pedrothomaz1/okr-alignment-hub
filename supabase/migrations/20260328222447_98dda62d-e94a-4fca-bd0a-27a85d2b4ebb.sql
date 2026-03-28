
CREATE TABLE public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  unit TEXT NOT NULL,
  dre_line TEXT NOT NULL,
  action TEXT NOT NULL,
  owner_id UUID NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expected_impact TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view initiatives" ON public.initiatives
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/OKR master can create initiatives" ON public.initiatives
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'okr_master'));

CREATE POLICY "Admin/OKR master/owner can update initiatives" ON public.initiatives
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'okr_master') OR owner_id = auth.uid());

CREATE POLICY "Admin can delete initiatives" ON public.initiatives
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_initiatives_updated_at
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER initiatives_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.initiatives
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_fn();
