
-- 1. Tabela business_units
CREATE TABLE public.business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#0ea5a4',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view business_units"
  ON public.business_units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert business_units"
  ON public.business_units FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update business_units"
  ON public.business_units FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete business_units"
  ON public.business_units FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_business_units_updated_at
  BEFORE UPDATE ON public.business_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela user_business_units (N:N)
CREATE TABLE public.user_business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_unit_id)
);

CREATE INDEX idx_ubu_user ON public.user_business_units(user_id);
CREATE INDEX idx_ubu_bu ON public.user_business_units(business_unit_id);

ALTER TABLE public.user_business_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bu links"
  ON public.user_business_units FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'okr_master'));

CREATE POLICY "Admin can insert user_business_units"
  ON public.user_business_units FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete user_business_units"
  ON public.user_business_units FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Função SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.user_can_see_bu(_user_id UUID, _bu_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    _bu_id IS NULL
    OR public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'okr_master')
    OR EXISTS (
      SELECT 1 FROM public.user_business_units
      WHERE user_id = _user_id AND business_unit_id = _bu_id
    )
$$;

CREATE OR REPLACE FUNCTION public.user_shares_bu(_viewer_id UUID, _target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    _viewer_id = _target_user_id
    OR public.has_role(_viewer_id, 'admin')
    OR public.has_role(_viewer_id, 'okr_master')
    OR EXISTS (
      SELECT 1
      FROM public.user_business_units a
      JOIN public.user_business_units b ON a.business_unit_id = b.business_unit_id
      WHERE a.user_id = _viewer_id AND b.user_id = _target_user_id
    )
    -- Allow if target has no BU (visible globally)
    OR NOT EXISTS (
      SELECT 1 FROM public.user_business_units WHERE user_id = _target_user_id
    )
$$;

-- 4. Adicionar business_unit_id às tabelas
ALTER TABLE public.cycles ADD COLUMN business_unit_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL;
ALTER TABLE public.objectives ADD COLUMN business_unit_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL;
ALTER TABLE public.initiatives ADD COLUMN business_unit_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL;

CREATE INDEX idx_cycles_bu ON public.cycles(business_unit_id);
CREATE INDEX idx_objectives_bu ON public.objectives(business_unit_id);
CREATE INDEX idx_initiatives_bu ON public.initiatives(business_unit_id);

-- 5. Substituir SELECT policies para considerar BU
DROP POLICY IF EXISTS "Authenticated can view cycles" ON public.cycles;
CREATE POLICY "BU-aware view cycles" ON public.cycles
  FOR SELECT TO authenticated
  USING (public.user_can_see_bu(auth.uid(), business_unit_id));

DROP POLICY IF EXISTS "Authenticated can view objectives" ON public.objectives;
CREATE POLICY "BU-aware view objectives" ON public.objectives
  FOR SELECT TO authenticated
  USING (public.user_can_see_bu(auth.uid(), business_unit_id));

DROP POLICY IF EXISTS "Authenticated can view initiatives" ON public.initiatives;
CREATE POLICY "BU-aware view initiatives" ON public.initiatives
  FOR SELECT TO authenticated
  USING (public.user_can_see_bu(auth.uid(), business_unit_id));

-- 6. Restringir KRs com base no objetivo
DROP POLICY IF EXISTS "Authenticated can view key_results" ON public.key_results;
CREATE POLICY "BU-aware view key_results" ON public.key_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = key_results.objective_id
        AND public.user_can_see_bu(auth.uid(), o.business_unit_id)
    )
  );

-- 7. Engajamento: PPP / Pulse / Kudos compartilhar BU
-- weekly_ppp: adiciona política BU-aware (já existe restrição própria) e ajusta a abrangência
DROP POLICY IF EXISTS "Managers can view subordinates ppp" ON public.weekly_ppp;
CREATE POLICY "BU peers can view ppp" ON public.weekly_ppp
  FOR SELECT TO authenticated
  USING (public.user_shares_bu(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can view own ppp" ON public.weekly_ppp; -- coberto pelo shares_bu
CREATE POLICY "Users can view own ppp" ON public.weekly_ppp
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers can view subordinates pulse" ON public.pulse_surveys;
CREATE POLICY "BU peers can view pulse" ON public.pulse_surveys
  FOR SELECT TO authenticated
  USING (public.user_shares_bu(auth.uid(), user_id));

-- kudos: visível se viewer compartilha BU com remetente OU destinatário
DROP POLICY IF EXISTS "Authenticated can view kudos" ON public.kudos;
CREATE POLICY "BU-aware view kudos" ON public.kudos
  FOR SELECT TO authenticated
  USING (
    public.user_shares_bu(auth.uid(), from_user_id)
    OR public.user_shares_bu(auth.uid(), to_user_id)
  );

-- 8. Permissões RBAC
INSERT INTO public.permissions (key, description) VALUES
  ('business_units.manage', 'Criar, editar e arquivar Business Units'),
  ('business_units.assign', 'Vincular usuários a Business Units')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
WHERE key IN ('business_units.manage', 'business_units.assign')
ON CONFLICT DO NOTHING;
