
-- 1. Add locked column to cycles
ALTER TABLE public.cycles ADD COLUMN locked BOOLEAN NOT NULL DEFAULT false;

-- 2. Create cycle_requests table
CREATE TABLE public.cycle_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  approver_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decision_at TIMESTAMPTZ,
  decision_by UUID
);

CREATE INDEX idx_cycle_requests_cycle_id ON public.cycle_requests(cycle_id);
CREATE INDEX idx_cycle_requests_status ON public.cycle_requests(status);

ALTER TABLE public.cycle_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: requester, approver, or admins
CREATE POLICY "Requester/approver/admin can view cycle_requests"
  ON public.cycle_requests FOR SELECT
  USING (
    requested_by = auth.uid()
    OR decision_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- INSERT: admin or okr_master
CREATE POLICY "Admin/OKR master can create cycle_requests"
  ON public.cycle_requests FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- UPDATE: admin only (for decisions)
CREATE POLICY "Admin can update cycle_requests"
  ON public.cycle_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- DELETE: admin only
CREATE POLICY "Admin can delete cycle_requests"
  ON public.cycle_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create cycle_rules_history table
CREATE TABLE public.cycle_rules_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  rule_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cycle_rules_history_cycle_id ON public.cycle_rules_history(cycle_id);

ALTER TABLE public.cycle_rules_history ENABLE ROW LEVEL SECURITY;

-- SELECT: admin or okr_master
CREATE POLICY "Admin/OKR master can view cycle_rules_history"
  ON public.cycle_rules_history FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- INSERT: admin or okr_master
CREATE POLICY "Admin/OKR master can insert cycle_rules_history"
  ON public.cycle_rules_history FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- 4. Function: decide_cycle_request
CREATE OR REPLACE FUNCTION public.decide_cycle_request(
  _request_id UUID,
  _decision TEXT,
  _comment TEXT DEFAULT NULL,
  _approver_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req RECORD;
  _cycle RECORD;
  _new_cycle_status TEXT;
  _actual_approver UUID;
BEGIN
  _actual_approver := COALESCE(_approver_id, (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID);

  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT * INTO _req FROM public.cycle_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF _req.status != 'pending' THEN
    RAISE EXCEPTION 'Request already decided';
  END IF;

  -- Update request
  UPDATE public.cycle_requests
  SET status = _decision,
      decision_by = _actual_approver,
      decision_at = now(),
      comment = COALESCE(_comment, comment)
  WHERE id = _request_id;

  -- Update cycle status
  IF _decision = 'approved' THEN
    _new_cycle_status := 'active';
  ELSE
    _new_cycle_status := 'draft';
  END IF;

  SELECT * INTO _cycle FROM public.cycles WHERE id = _req.cycle_id;

  UPDATE public.cycles
  SET status = _new_cycle_status
  WHERE id = _req.cycle_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, metadata)
  VALUES (
    _actual_approver,
    'cycle_request',
    _request_id,
    _decision,
    jsonb_build_object('cycle_id', _req.cycle_id, 'comment', _comment)
  );

  RETURN jsonb_build_object('status', _decision, 'cycle_id', _req.cycle_id);
END;
$$;

-- 5. Trigger: auto-lock cycle when status changes to 'active' if lock_after_start
CREATE OR REPLACE FUNCTION public.lock_cycle_on_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    IF (NEW.metadata->>'lock_after_start')::boolean IS TRUE THEN
      NEW.locked := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lock_cycle_on_active
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_cycle_on_active();

-- 6. Audit triggers on new tables
CREATE TRIGGER audit_cycle_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.cycle_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_cycle_rules_history
  AFTER INSERT OR UPDATE OR DELETE ON public.cycle_rules_history
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
