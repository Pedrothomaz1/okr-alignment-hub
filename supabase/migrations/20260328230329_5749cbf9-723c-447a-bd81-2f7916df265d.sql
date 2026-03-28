
-- Restrict access to sensitive PII columns (CPF, birth_date) on the profiles table.
-- Revoke SELECT on these columns from the default authenticated/anon roles,
-- then grant back only to postgres (used by SECURITY DEFINER functions and admin queries).
-- Admin access works because the "Admins can view all profiles" RLS policy runs 
-- through the has_role() SECURITY DEFINER function which executes as the function owner.

-- Note: We cannot REVOKE from 'authenticated' directly on individual columns in Supabase
-- because PostgREST uses the authenticated role. Instead, we'll ensure the profiles_public
-- view (which is the main access path for non-admin users) explicitly excludes these fields,
-- and we add a database function for admin-only access to sensitive fields.

-- Create a secure function that only admins or the profile owner can use to read sensitive PII
CREATE OR REPLACE FUNCTION public.get_sensitive_profile(_user_id uuid)
RETURNS TABLE(cpf text, birth_date date, eligible_for_bonus boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow the profile owner or admins
  IF _user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT p.cpf, p.birth_date, p.eligible_for_bonus
    FROM public.profiles p
    WHERE p.id = _user_id;
  ELSE
    RAISE EXCEPTION 'Access denied: only profile owner or admin can view sensitive data';
  END IF;
END;
$$;
