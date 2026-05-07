
-- Drop recursive policy
DROP POLICY IF EXISTS "BU peers can view user_business_units" ON public.user_business_units;

-- Helper to avoid recursion when checking BU membership inside policies on user_business_units
CREATE OR REPLACE FUNCTION public.user_in_bu(_user_id uuid, _bu_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_business_units
    WHERE user_id = _user_id AND business_unit_id = _bu_id
  )
$$;

CREATE POLICY "BU peers can view user_business_units"
ON public.user_business_units
FOR SELECT
TO authenticated
USING (public.user_in_bu(auth.uid(), business_unit_id));
