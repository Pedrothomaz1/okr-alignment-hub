
-- Fix 1: Remove broad "Users can update own profile" policy (privilege escalation risk)
-- Users should use update_own_profile RPC for safe field updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Fix 2: Remove client INSERT policy on audit_logs (forgery risk)
-- Audit logs are written by triggers and edge functions only
DROP POLICY IF EXISTS "Authenticated can insert own audit" ON public.audit_logs;

-- Fix 3: Set security_invoker on profiles_public view so underlying RLS is enforced
ALTER VIEW public.profiles_public SET (security_invoker = true);
