-- Allow all authenticated users to view profiles (needed for owner selectors)
CREATE POLICY "Authenticated can view all profiles"
ON public.profiles
FOR SELECT
USING (true);