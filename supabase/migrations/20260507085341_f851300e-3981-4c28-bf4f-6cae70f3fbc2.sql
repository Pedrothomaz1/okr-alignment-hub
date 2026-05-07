
-- 1. Tighten user_shares_bu (remove "target with no BU is global")
CREATE OR REPLACE FUNCTION public.user_shares_bu(_viewer_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 2. Allow BU peers to view user_business_units links
CREATE POLICY "BU peers can view user_business_units"
ON public.user_business_units
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_business_units mine
    WHERE mine.user_id = auth.uid()
      AND mine.business_unit_id = user_business_units.business_unit_id
  )
);

-- 3. Require BU for non-admin/okr_master on cycles, objectives, initiatives
DROP POLICY IF EXISTS "Admin/OKR master can create cycles" ON public.cycles;
CREATE POLICY "Admin/OKR master can create cycles"
ON public.cycles
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'okr_master'::app_role))
  AND (
    business_unit_id IS NOT NULL
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  )
);

DROP POLICY IF EXISTS "Admin/OKR master/owner can create objectives" ON public.objectives;
CREATE POLICY "Admin/OKR master/owner can create objectives"
ON public.objectives
FOR INSERT
TO authenticated
WITH CHECK (
  (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR (owner_id = auth.uid())
  )
  AND (
    business_unit_id IS NOT NULL
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  )
);

DROP POLICY IF EXISTS "Admin/OKR master can create initiatives" ON public.initiatives;
CREATE POLICY "Admin/OKR master can create initiatives"
ON public.initiatives
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'okr_master'::app_role))
  AND (
    business_unit_id IS NOT NULL
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  )
);
