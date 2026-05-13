GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_see_bu(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_shares_bu(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_in_bu(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_can_see_bu(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_shares_bu(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_in_bu(uuid, uuid) FROM anon;