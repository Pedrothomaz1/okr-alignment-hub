
-- 1) Pulse surveys: remove BU-peer access; add manager access
DROP POLICY IF EXISTS "BU peers can view pulse" ON public.pulse_surveys;
CREATE POLICY "Manager can view direct report pulse"
ON public.pulse_surveys FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pulse_surveys.user_id AND p.manager_id = auth.uid()));

-- 2) Weekly PPP: remove BU-peer access; add manager access
DROP POLICY IF EXISTS "BU peers can view ppp" ON public.weekly_ppp;
CREATE POLICY "Manager can view direct report ppp"
ON public.weekly_ppp FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = weekly_ppp.user_id AND p.manager_id = auth.uid()));

-- 3) kr_checkins: BU-aware SELECT
DROP POLICY IF EXISTS "Authenticated can view checkins" ON public.kr_checkins;
CREATE POLICY "BU-aware view kr_checkins"
ON public.kr_checkins FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = kr_checkins.key_result_id
      AND public.user_can_see_bu(auth.uid(), o.business_unit_id)
  )
);

-- 4) Realtime: restrict notifications channel subscription per-user
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can subscribe to own notification channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notification channel"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = 'notifications-' || auth.uid()::text
);

-- 5) Storage: drop broad listing SELECT on avatars (public URLs still work via CDN)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 6) Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers/triggers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_can_see_bu(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_shares_bu(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_in_bu(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recalc_objective_progress(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_objective_progress() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_kr_value_on_checkin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_cycle_on_active() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.propagate_objective_progress() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_fn() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recalc_parent_on_objective_delete() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_circular_parent() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_cycle_dates() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Revoke from anon (not authenticated) on RPCs intentionally callable by signed-in users
REVOKE EXECUTE ON FUNCTION public.update_own_profile(text, text, text, text, text, text, date, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_sensitive_profile(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_objective_ancestors(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.decide_cycle_request(uuid, text, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.decide_change_request(uuid, text, text) FROM anon, public;
