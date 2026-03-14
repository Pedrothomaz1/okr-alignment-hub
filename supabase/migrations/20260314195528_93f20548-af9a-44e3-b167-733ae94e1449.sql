
-- =============================================
-- FIX: Change all SELECT policies from {public} to {authenticated}
-- on 6 tables exposing data without authentication
-- =============================================

-- 1. PROFILES: Drop public SELECT policy, recreate as authenticated
DROP POLICY IF EXISTS "Authenticated can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Also fix INSERT policy on profiles (trigger uses public for new user creation - keep it)
-- The "Trigger inserts profiles" policy needs public for handle_new_user trigger

-- 2. KR_CHECKINS: Fix SELECT + other policies from public to authenticated
DROP POLICY IF EXISTS "Authenticated can view checkins" ON public.kr_checkins;
CREATE POLICY "Authenticated can view checkins"
  ON public.kr_checkins FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete checkins" ON public.kr_checkins;
CREATE POLICY "Admin can delete checkins"
  ON public.kr_checkins FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/OKR master/KR owner can insert checkins" ON public.kr_checkins;
CREATE POLICY "Admin/OKR master/KR owner can insert checkins"
  ON public.kr_checkins FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR EXISTS (
      SELECT 1 FROM key_results
      WHERE key_results.id = kr_checkins.key_result_id
        AND key_results.owner_id = auth.uid()
    )
  );

-- 3. KUDOS: Fix all policies from public to authenticated
DROP POLICY IF EXISTS "Authenticated can view kudos" ON public.kudos;
CREATE POLICY "Authenticated can view kudos"
  ON public.kudos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete kudos" ON public.kudos;
CREATE POLICY "Admin can delete kudos"
  ON public.kudos FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Author can delete own kudos" ON public.kudos;
CREATE POLICY "Author can delete own kudos"
  ON public.kudos FOR DELETE
  TO authenticated
  USING (from_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own kudos" ON public.kudos;
CREATE POLICY "Users can insert own kudos"
  ON public.kudos FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- 4. ACTIVITY_COMMENTS: Fix all policies from public to authenticated
DROP POLICY IF EXISTS "Authenticated can view activity_comments" ON public.activity_comments;
CREATE POLICY "Authenticated can view activity_comments"
  ON public.activity_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete activity_comments" ON public.activity_comments;
CREATE POLICY "Admin can delete activity_comments"
  ON public.activity_comments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Author can delete own activity_comments" ON public.activity_comments;
CREATE POLICY "Author can delete own activity_comments"
  ON public.activity_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can insert own activity_comments" ON public.activity_comments;
CREATE POLICY "Authenticated can insert own activity_comments"
  ON public.activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- 5. OBJECTIVES: Fix all policies from public to authenticated
DROP POLICY IF EXISTS "Authenticated can view objectives" ON public.objectives;
CREATE POLICY "Authenticated can view objectives"
  ON public.objectives FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete objectives" ON public.objectives;
CREATE POLICY "Admin can delete objectives"
  ON public.objectives FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/OKR master/owner can create objectives" ON public.objectives;
CREATE POLICY "Admin/OKR master/owner can create objectives"
  ON public.objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin/OKR master/owner can update objectives" ON public.objectives;
CREATE POLICY "Admin/OKR master/owner can update objectives"
  ON public.objectives FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

-- 6. KEY_RESULTS: Fix all policies from public to authenticated
DROP POLICY IF EXISTS "Authenticated can view key_results" ON public.key_results;
CREATE POLICY "Authenticated can view key_results"
  ON public.key_results FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete key_results" ON public.key_results;
CREATE POLICY "Admin can delete key_results"
  ON public.key_results FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/OKR master/owner can create key_results" ON public.key_results;
CREATE POLICY "Admin/OKR master/owner can create key_results"
  ON public.key_results FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin/OKR master/owner can update key_results" ON public.key_results;
CREATE POLICY "Admin/OKR master/owner can update key_results"
  ON public.key_results FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR owner_id = auth.uid()
  );

-- =============================================
-- Also fix remaining tables that have public policies:
-- okr_collaborators, okr_links, feed_reactions, notifications,
-- change_requests, cycle_requests, cycle_rules_history,
-- weekly_ppp, pulse_surveys
-- =============================================

-- OKR_COLLABORATORS
DROP POLICY IF EXISTS "Authenticated can view okr_collaborators" ON public.okr_collaborators;
CREATE POLICY "Authenticated can view okr_collaborators"
  ON public.okr_collaborators FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin/OKR master/owner can delete okr_collaborators" ON public.okr_collaborators;
CREATE POLICY "Admin/OKR master/owner can delete okr_collaborators"
  ON public.okr_collaborators FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR EXISTS (SELECT 1 FROM objectives WHERE objectives.id = okr_collaborators.objective_id AND objectives.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin/OKR master/owner can manage okr_collaborators" ON public.okr_collaborators;
CREATE POLICY "Admin/OKR master/owner can manage okr_collaborators"
  ON public.okr_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR EXISTS (SELECT 1 FROM objectives WHERE objectives.id = okr_collaborators.objective_id AND objectives.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin/OKR master/owner can update okr_collaborators" ON public.okr_collaborators;
CREATE POLICY "Admin/OKR master/owner can update okr_collaborators"
  ON public.okr_collaborators FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR EXISTS (SELECT 1 FROM objectives WHERE objectives.id = okr_collaborators.objective_id AND objectives.owner_id = auth.uid())
  );

-- OKR_LINKS
DROP POLICY IF EXISTS "Authenticated can view okr_links" ON public.okr_links;
CREATE POLICY "Authenticated can view okr_links"
  ON public.okr_links FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin or creator can delete okr_links" ON public.okr_links;
CREATE POLICY "Admin or creator can delete okr_links"
  ON public.okr_links FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Admin/OKR master can insert okr_links" ON public.okr_links;
CREATE POLICY "Admin/OKR master can insert okr_links"
  ON public.okr_links FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
    OR created_by = auth.uid()
  );

-- FEED_REACTIONS
DROP POLICY IF EXISTS "Authenticated can view reactions" ON public.feed_reactions;
CREATE POLICY "Authenticated can view reactions"
  ON public.feed_reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.feed_reactions;
CREATE POLICY "Users can delete own reactions"
  ON public.feed_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own reactions" ON public.feed_reactions;
CREATE POLICY "Users can insert own reactions"
  ON public.feed_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admin can delete notifications" ON public.notifications;
CREATE POLICY "Admin can delete notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- CHANGE_REQUESTS
DROP POLICY IF EXISTS "Admin can delete change_requests" ON public.change_requests;
CREATE POLICY "Admin can delete change_requests"
  ON public.change_requests FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can update change_requests" ON public.change_requests;
CREATE POLICY "Admin can update change_requests"
  ON public.change_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can create change_requests" ON public.change_requests;
CREATE POLICY "Authenticated can create change_requests"
  ON public.change_requests FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS "Requester/admin/okr_master can view change_requests" ON public.change_requests;
CREATE POLICY "Requester/admin/okr_master can view change_requests"
  ON public.change_requests FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- CYCLE_REQUESTS
DROP POLICY IF EXISTS "Admin can delete cycle_requests" ON public.cycle_requests;
CREATE POLICY "Admin can delete cycle_requests"
  ON public.cycle_requests FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can update cycle_requests" ON public.cycle_requests;
CREATE POLICY "Admin can update cycle_requests"
  ON public.cycle_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/OKR master can create cycle_requests" ON public.cycle_requests;
CREATE POLICY "Admin/OKR master can create cycle_requests"
  ON public.cycle_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

DROP POLICY IF EXISTS "Requester/approver/admin can view cycle_requests" ON public.cycle_requests;
CREATE POLICY "Requester/approver/admin can view cycle_requests"
  ON public.cycle_requests FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR decision_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- CYCLE_RULES_HISTORY
DROP POLICY IF EXISTS "Admin/OKR master can insert cycle_rules_history" ON public.cycle_rules_history;
CREATE POLICY "Admin/OKR master can insert cycle_rules_history"
  ON public.cycle_rules_history FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

DROP POLICY IF EXISTS "Admin/OKR master can view cycle_rules_history" ON public.cycle_rules_history;
CREATE POLICY "Admin/OKR master can view cycle_rules_history"
  ON public.cycle_rules_history FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- WEEKLY_PPP
DROP POLICY IF EXISTS "Admins can delete ppp" ON public.weekly_ppp;
CREATE POLICY "Admins can delete ppp"
  ON public.weekly_ppp FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all ppp" ON public.weekly_ppp;
CREATE POLICY "Admins can view all ppp"
  ON public.weekly_ppp FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Managers can view subordinates ppp" ON public.weekly_ppp;
CREATE POLICY "Managers can view subordinates ppp"
  ON public.weekly_ppp FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = weekly_ppp.user_id AND profiles.manager_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own ppp" ON public.weekly_ppp;
CREATE POLICY "Users can insert own ppp"
  ON public.weekly_ppp FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own ppp" ON public.weekly_ppp;
CREATE POLICY "Users can update own ppp"
  ON public.weekly_ppp FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own ppp" ON public.weekly_ppp;
CREATE POLICY "Users can view own ppp"
  ON public.weekly_ppp FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- PULSE_SURVEYS
DROP POLICY IF EXISTS "Admins can delete pulse" ON public.pulse_surveys;
CREATE POLICY "Admins can delete pulse"
  ON public.pulse_surveys FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update pulse" ON public.pulse_surveys;
CREATE POLICY "Admins can update pulse"
  ON public.pulse_surveys FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all pulse" ON public.pulse_surveys;
CREATE POLICY "Admins can view all pulse"
  ON public.pulse_surveys FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Managers can view subordinates pulse" ON public.pulse_surveys;
CREATE POLICY "Managers can view subordinates pulse"
  ON public.pulse_surveys FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = pulse_surveys.user_id AND profiles.manager_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own pulse" ON public.pulse_surveys;
CREATE POLICY "Users can insert own pulse"
  ON public.pulse_surveys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own pulse" ON public.pulse_surveys;
CREATE POLICY "Users can view own pulse"
  ON public.pulse_surveys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
