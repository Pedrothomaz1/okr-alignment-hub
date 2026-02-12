
-- 1. Add parent_objective_id to objectives
ALTER TABLE public.objectives
ADD COLUMN parent_objective_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL;

CREATE INDEX idx_objectives_parent ON public.objectives(parent_objective_id);

-- 2. Create okr_links table
CREATE TABLE public.okr_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID NOT NULL,
  to_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'related',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_link UNIQUE(from_id, to_id),
  CONSTRAINT no_self_link CHECK (from_id != to_id)
);

ALTER TABLE public.okr_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view okr_links"
ON public.okr_links FOR SELECT
USING (true);

CREATE POLICY "Admin/OKR master can insert okr_links"
ON public.okr_links FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'okr_master'::app_role)
  OR created_by = auth.uid()
);

CREATE POLICY "Admin or creator can delete okr_links"
ON public.okr_links FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
);

-- 3. Create okr_collaborators table
CREATE TABLE public.okr_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_collaborator UNIQUE(objective_id, user_id)
);

ALTER TABLE public.okr_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view okr_collaborators"
ON public.okr_collaborators FOR SELECT
USING (true);

CREATE POLICY "Admin/OKR master/owner can manage okr_collaborators"
ON public.okr_collaborators FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'okr_master'::app_role)
  OR EXISTS (SELECT 1 FROM public.objectives WHERE id = objective_id AND owner_id = auth.uid())
);

CREATE POLICY "Admin/OKR master/owner can update okr_collaborators"
ON public.okr_collaborators FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'okr_master'::app_role)
  OR EXISTS (SELECT 1 FROM public.objectives WHERE id = objective_id AND owner_id = auth.uid())
);

CREATE POLICY "Admin/OKR master/owner can delete okr_collaborators"
ON public.okr_collaborators FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'okr_master'::app_role)
  OR EXISTS (SELECT 1 FROM public.objectives WHERE id = objective_id AND owner_id = auth.uid())
);

-- 4. Function get_objective_ancestors
CREATE OR REPLACE FUNCTION public.get_objective_ancestors(_objective_id UUID)
RETURNS SETOF public.objectives
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT o.* FROM public.objectives o WHERE o.id = _objective_id
    UNION ALL
    SELECT parent.* FROM public.objectives parent
    JOIN ancestors a ON parent.id = a.parent_objective_id
  )
  SELECT * FROM ancestors ORDER BY created_at;
$$;

-- 5. Trigger to prevent circular parent references
CREATE OR REPLACE FUNCTION public.prevent_circular_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_id UUID;
  _depth INT := 0;
BEGIN
  IF NEW.parent_objective_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_objective_id = NEW.id THEN
    RAISE EXCEPTION 'An objective cannot be its own parent';
  END IF;

  _current_id := NEW.parent_objective_id;
  LOOP
    SELECT parent_objective_id INTO _current_id
    FROM public.objectives
    WHERE id = _current_id;

    IF _current_id IS NULL THEN
      EXIT;
    END IF;

    IF _current_id = NEW.id THEN
      RAISE EXCEPTION 'Circular parent reference detected';
    END IF;

    _depth := _depth + 1;
    IF _depth > 50 THEN
      RAISE EXCEPTION 'Maximum hierarchy depth exceeded';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_circular_parent
BEFORE INSERT OR UPDATE ON public.objectives
FOR EACH ROW
EXECUTE FUNCTION public.prevent_circular_parent();

-- 6. Audit triggers on new tables
CREATE TRIGGER audit_okr_links
AFTER INSERT OR UPDATE OR DELETE ON public.okr_links
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_okr_collaborators
AFTER INSERT OR UPDATE OR DELETE ON public.okr_collaborators
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
