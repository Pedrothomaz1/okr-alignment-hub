
-- Restrict profiles_public view to authenticated users only.
-- Revoke all access from anon role to prevent unauthenticated access.
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;
