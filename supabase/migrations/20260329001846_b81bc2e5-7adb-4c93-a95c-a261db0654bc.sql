
-- Fix 1: Sanitize audit trigger to strip sensitive PII fields from profiles snapshots
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _actor_id UUID;
  _before jsonb;
  _after jsonb;
BEGIN
  BEGIN
    _actor_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION WHEN OTHERS THEN
    _actor_id := NULL;
  END;

  -- Strip sensitive PII fields when auditing the profiles table
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' THEN
      _after := to_jsonb(NEW) - 'cpf' - 'birth_date' - 'eligible_for_bonus';
      INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, after_state)
      VALUES (_actor_id, TG_TABLE_NAME, NEW.id, 'INSERT', _after);
      RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
      _before := to_jsonb(OLD) - 'cpf' - 'birth_date' - 'eligible_for_bonus';
      _after := to_jsonb(NEW) - 'cpf' - 'birth_date' - 'eligible_for_bonus';
      INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, before_state, after_state)
      VALUES (_actor_id, TG_TABLE_NAME, NEW.id, 'UPDATE', _before, _after);
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      _before := to_jsonb(OLD) - 'cpf' - 'birth_date' - 'eligible_for_bonus';
      INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, before_state)
      VALUES (_actor_id, TG_TABLE_NAME, OLD.id, 'DELETE', _before);
      RETURN OLD;
    END IF;
  ELSE
    -- Non-profiles tables: standard behavior
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, after_state)
      VALUES (_actor_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
      RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, before_state, after_state)
      VALUES (_actor_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, before_state)
      VALUES (_actor_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix 2: Tighten okr_links INSERT policy - remove overly permissive OR condition
DROP POLICY IF EXISTS "Admin/OKR master can insert okr_links" ON public.okr_links;
CREATE POLICY "Admin/OKR master/owner can insert okr_links"
  ON public.okr_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'okr_master'::app_role)
  );

-- Fix 3: Redact existing PII from historical audit_logs
UPDATE public.audit_logs
SET
  before_state = before_state - 'cpf' - 'birth_date' - 'eligible_for_bonus',
  after_state = after_state - 'cpf' - 'birth_date' - 'eligible_for_bonus'
WHERE entity_type = 'profiles'
  AND (
    before_state ? 'cpf' OR before_state ? 'birth_date' OR before_state ? 'eligible_for_bonus'
    OR after_state ? 'cpf' OR after_state ? 'birth_date' OR after_state ? 'eligible_for_bonus'
  );
