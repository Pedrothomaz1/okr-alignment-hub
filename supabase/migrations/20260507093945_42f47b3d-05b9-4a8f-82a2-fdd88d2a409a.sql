CREATE OR REPLACE FUNCTION public.user_can_see_bu(_user_id uuid, _bu_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'okr_master')
    OR _bu_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.user_business_units
      WHERE user_id = _user_id AND business_unit_id = _bu_id
    )
$function$;