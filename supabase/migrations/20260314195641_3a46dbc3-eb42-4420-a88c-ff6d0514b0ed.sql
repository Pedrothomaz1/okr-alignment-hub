
-- Create a public view that exposes only non-sensitive profile fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, full_name, avatar_url, job_title, department, management, status, manager_id, created_at, updated_at
  FROM public.profiles;

-- Drop the blanket "Authenticated can view all profiles" policy
DROP POLICY IF EXISTS "Authenticated can view all profiles" ON public.profiles;

-- Create a restricted policy: users see own full profile, admins see all, others see via view
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;
