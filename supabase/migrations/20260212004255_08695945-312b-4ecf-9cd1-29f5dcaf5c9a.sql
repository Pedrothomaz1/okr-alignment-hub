
-- Remove overly permissive INSERT policies and replace with tighter ones
DROP POLICY "Service can insert profiles" ON public.profiles;
DROP POLICY "Service can insert user_roles" ON public.user_roles;
DROP POLICY "Service can insert audit_logs" ON public.audit_logs;

-- Profiles: only the user themselves can insert (triggered by auth, id must match)
CREATE POLICY "Trigger inserts profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- user_roles: admins can insert, plus trigger (which bypasses RLS as security definer)
-- The handle_new_user trigger uses SECURITY DEFINER so it bypasses RLS.
-- No open INSERT policy needed beyond the admin one already created.

-- audit_logs: only allow insert if actor matches authenticated user (triggers bypass via security definer)
CREATE POLICY "Authenticated can insert own audit"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
