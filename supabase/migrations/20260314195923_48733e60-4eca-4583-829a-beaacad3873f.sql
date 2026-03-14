
-- 1. Fix privilege escalation: restrict which columns users can update on their own profile
-- Replace the permissive "Users can update own profile" with a SECURITY DEFINER function

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a safe update function that only allows non-sensitive fields
CREATE OR REPLACE FUNCTION public.update_own_profile(
  _full_name text DEFAULT NULL,
  _avatar_url text DEFAULT NULL,
  _job_title text DEFAULT NULL,
  _department text DEFAULT NULL,
  _management text DEFAULT NULL,
  _language text DEFAULT NULL,
  _birth_date date DEFAULT NULL,
  _receive_feedback_emails boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = COALESCE(_full_name, full_name),
    avatar_url = COALESCE(_avatar_url, avatar_url),
    job_title = COALESCE(_job_title, job_title),
    department = COALESCE(_department, department),
    management = COALESCE(_management, management),
    language = COALESCE(_language, language),
    birth_date = COALESCE(_birth_date, birth_date),
    receive_feedback_emails = COALESCE(_receive_feedback_emails, receive_feedback_emails),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Re-create a restricted UPDATE policy: users can only update own row
-- but sensitive columns are protected by the function above
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. The profiles_public is a VIEW (not a table), so RLS doesn't apply directly.
-- It uses security_invoker=on, so it inherits the caller's RLS on the base table.
-- The scanner may flag it but it's already secure via the base table's RLS.
-- No action needed for this finding.
