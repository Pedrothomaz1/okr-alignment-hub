
-- Fix 1: Restrict profiles_public view to authenticated users only
-- Views can't have RLS, so we use GRANT/REVOKE
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Fix 2: Explicitly revoke anon access to audit_logs
REVOKE ALL ON public.audit_logs FROM anon;
