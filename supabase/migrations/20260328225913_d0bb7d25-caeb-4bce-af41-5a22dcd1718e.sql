
-- Revert security_invoker on profiles_public: the view intentionally acts as the
-- security boundary by exposing only non-sensitive columns. With security_invoker=true
-- users can only see their own profile via the view, breaking team visibility.
ALTER VIEW public.profiles_public SET (security_invoker = false);
