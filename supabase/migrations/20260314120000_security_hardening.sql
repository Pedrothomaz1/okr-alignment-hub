-- ============================================================
-- Security Hardening Migration
-- Date: 2026-03-14
-- Scope: FK constraints, auth enforcement triggers, audit triggers,
--         explicit immutability policies, storage validation
-- ============================================================

-- ============================================================
-- CRIT-1: activity_comments.author_id — FK + server-side enforcement
-- Risk: Users could forge author_id to impersonate others
-- ============================================================

ALTER TABLE public.activity_comments
ADD CONSTRAINT activity_comments_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.enforce_comment_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.author_id := auth.uid();
  IF NEW.author_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to post comments';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_comment_author_trigger
BEFORE INSERT ON public.activity_comments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_comment_author();

-- ============================================================
-- CRIT-2: notifications — audit trigger
-- Risk: Service role inserts without audit trail
-- Note: service_role already bypasses RLS; audit trigger is
--       the key control here.
-- ============================================================

CREATE TRIGGER audit_notifications
AFTER INSERT OR UPDATE OR DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ============================================================
-- HIGH-2: kr_checkins — explicit immutability
-- Risk: Without explicit policy, implicit DENY is invisible;
--        future devs may add permissive UPDATE by mistake.
-- ============================================================

CREATE POLICY "Check-ins are immutable"
ON public.kr_checkins FOR UPDATE
TO authenticated
USING (false);

COMMENT ON TABLE public.kr_checkins IS
  'Immutable check-in history. Updates not permitted. Delete and re-create if correction needed.';

-- ============================================================
-- HIGH-3: okr_links — missing UPDATE policy
-- ============================================================

CREATE POLICY "Creator or admin can update okr_links"
ON public.okr_links FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================================
-- HIGH-4: Missing FK constraints
-- Risk: Orphaned UUIDs if users are deleted
-- ============================================================

ALTER TABLE public.cycle_requests
ADD CONSTRAINT cycle_requests_decision_by_fkey
FOREIGN KEY (decision_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.cycle_requests
ADD CONSTRAINT cycle_requests_approver_id_fkey
FOREIGN KEY (approver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.change_requests
ADD CONSTRAINT change_requests_decision_by_fkey
FOREIGN KEY (decision_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.okr_links
ADD CONSTRAINT okr_links_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- MED-1: Missing audit triggers on 5 tables
-- Risk: No audit trail for data mutations (LGPD compliance gap)
-- ============================================================

CREATE TRIGGER audit_activity_comments
AFTER INSERT OR UPDATE OR DELETE ON public.activity_comments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_weekly_ppp
AFTER INSERT OR UPDATE OR DELETE ON public.weekly_ppp
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_pulse_surveys
AFTER INSERT OR UPDATE OR DELETE ON public.pulse_surveys
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_kudos
AFTER INSERT OR UPDATE OR DELETE ON public.kudos
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_feed_reactions
AFTER INSERT OR UPDATE OR DELETE ON public.feed_reactions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ============================================================
-- MED-3: Storage — avatar upload validation
-- Risk: Executable files or oversized uploads in avatars bucket
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_avatar_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, storage
AS $$
BEGIN
  IF NOT (NEW.name ~* '\.(jpg|jpeg|png|gif|webp)$') THEN
    RAISE EXCEPTION 'Invalid avatar file type. Allowed: jpg, jpeg, png, gif, webp';
  END IF;

  IF NEW.metadata->>'size' IS NOT NULL AND (NEW.metadata->>'size')::bigint > 5242880 THEN
    RAISE EXCEPTION 'Avatar file size exceeds 5MB limit';
  END IF;

  IF NEW.metadata->>'mimetype' IS NOT NULL
     AND NOT (NEW.metadata->>'mimetype' ~ '^image/(jpeg|png|gif|webp)$') THEN
    RAISE EXCEPTION 'Invalid MIME type for avatar';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_avatar_upload_trigger
BEFORE INSERT OR UPDATE ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'avatars')
EXECUTE FUNCTION public.validate_avatar_upload();
