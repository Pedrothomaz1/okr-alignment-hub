
-- Table: change_requests
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('edit_objective', 'edit_kr', 'add_kr', 'delete_kr')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  decision_by UUID,
  decision_comment TEXT,
  decision_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester/admin/okr_master can view change_requests"
ON public.change_requests FOR SELECT
USING (
  requested_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'okr_master'::app_role)
);

CREATE POLICY "Authenticated can create change_requests"
ON public.change_requests FOR INSERT
WITH CHECK (
  requested_by = auth.uid()
);

CREATE POLICY "Admin can update change_requests"
ON public.change_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete change_requests"
ON public.change_requests FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function: decide_change_request
CREATE OR REPLACE FUNCTION public.decide_change_request(
  _request_id UUID,
  _decision TEXT,
  _comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _req RECORD;
  _actor UUID;
BEGIN
  _actor := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;

  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT * INTO _req FROM public.change_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF _req.status != 'pending' THEN RAISE EXCEPTION 'Request already decided'; END IF;

  UPDATE public.change_requests
  SET status = _decision,
      decision_by = _actor,
      decision_comment = COALESCE(_comment, decision_comment),
      decision_at = now(),
      expires_at = CASE WHEN _decision = 'approved' THEN now() + interval '24 hours' ELSE NULL END
  WHERE id = _request_id;

  INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, metadata)
  VALUES (
    _actor, 'change_request', _request_id, _decision,
    jsonb_build_object('cycle_id', _req.cycle_id, 'objective_id', _req.objective_id, 'comment', _comment)
  );

  RETURN jsonb_build_object('status', _decision, 'request_id', _request_id);
END;
$$;

-- Audit trigger
CREATE TRIGGER audit_change_requests
AFTER INSERT OR UPDATE OR DELETE ON public.change_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
