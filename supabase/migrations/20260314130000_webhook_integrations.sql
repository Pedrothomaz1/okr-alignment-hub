-- ============================================================
-- webhook_integrations: server-side storage for webhook config
-- Replaces localStorage-based approach (security risk)
-- ============================================================

CREATE TABLE public.webhook_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'slack',
  webhook_url TEXT NOT NULL,
  notify_checkin BOOLEAN NOT NULL DEFAULT true,
  notify_kr_done BOOLEAN NOT NULL DEFAULT true,
  notify_kudos BOOLEAN NOT NULL DEFAULT true,
  notify_cycle BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_integrations_provider_check CHECK (provider IN ('slack')),
  CONSTRAINT webhook_integrations_url_check CHECK (webhook_url ~ '^https://hooks\.slack\.com/')
);

-- One webhook config per user per provider
CREATE UNIQUE INDEX webhook_integrations_user_provider_idx
ON public.webhook_integrations (user_id, provider);

-- RLS
ALTER TABLE public.webhook_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook integrations"
ON public.webhook_integrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own webhook integrations"
ON public.webhook_integrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own webhook integrations"
ON public.webhook_integrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own webhook integrations"
ON public.webhook_integrations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Audit trigger
CREATE TRIGGER audit_webhook_integrations
AFTER INSERT OR UPDATE OR DELETE ON public.webhook_integrations
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_webhook_integrations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_webhook_integrations_updated_at
BEFORE UPDATE ON public.webhook_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_webhook_integrations_updated_at();
