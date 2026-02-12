
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'okr_master', 'manager', 'member');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 4. Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);

-- 6. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 7. Create security definer has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 8. Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  _actor_id UUID;
BEGIN
  BEGIN
    _actor_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION WHEN OTHERS THEN
    _actor_id := NULL;
  END;

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
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 11. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- 13. RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert user_roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- 14. RLS Policies for permissions
CREATE POLICY "Authenticated can view permissions"
  ON public.permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for role_permissions
CREATE POLICY "Authenticated can view role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role_permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 16. RLS Policies for audit_logs
CREATE POLICY "Admins can view audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- 17. Seed default permissions
INSERT INTO public.permissions (key, description) VALUES
  ('okr.create', 'Create objectives and key results'),
  ('okr.edit', 'Edit objectives and key results'),
  ('okr.delete', 'Delete objectives and key results'),
  ('cycle.create', 'Create cycles'),
  ('cycle.approve', 'Approve cycles'),
  ('cycle.edit', 'Edit cycles'),
  ('checkin.create', 'Create check-ins'),
  ('checkin.edit', 'Edit check-ins'),
  ('report.view', 'View reports'),
  ('report.export', 'Export reports'),
  ('template.create', 'Create templates'),
  ('template.edit', 'Edit templates'),
  ('user.manage', 'Manage users and roles'),
  ('audit.view', 'View audit logs');
