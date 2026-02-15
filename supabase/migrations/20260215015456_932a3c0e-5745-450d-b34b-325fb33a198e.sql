
-- =============================================
-- Sprint 1: weekly_ppp & pulse_surveys
-- =============================================

CREATE TABLE public.weekly_ppp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  plans text NOT NULL,
  progress text NOT NULL,
  problems text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_ppp ENABLE ROW LEVEL SECURITY;

-- User sees own
CREATE POLICY "Users can view own ppp" ON public.weekly_ppp
  FOR SELECT USING (user_id = auth.uid());

-- Manager sees subordinates
CREATE POLICY "Managers can view subordinates ppp" ON public.weekly_ppp
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = weekly_ppp.user_id
        AND profiles.manager_id = auth.uid()
    )
  );

-- Admin sees all
CREATE POLICY "Admins can view all ppp" ON public.weekly_ppp
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own ppp" ON public.weekly_ppp
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ppp" ON public.weekly_ppp
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can delete ppp" ON public.weekly_ppp
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_weekly_ppp_updated_at
  BEFORE UPDATE ON public.weekly_ppp
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================

CREATE TABLE public.pulse_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.pulse_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pulse" ON public.pulse_surveys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view subordinates pulse" ON public.pulse_surveys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = pulse_surveys.user_id
        AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all pulse" ON public.pulse_surveys
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own pulse" ON public.pulse_surveys
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update pulse" ON public.pulse_surveys
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pulse" ON public.pulse_surveys
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Sprint 2: kudos & notifications
-- =============================================

CREATE TABLE public.kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view kudos" ON public.kudos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own kudos" ON public.kudos
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Author can delete own kudos" ON public.kudos
  FOR DELETE USING (from_user_id = auth.uid());

CREATE POLICY "Admin can delete kudos" ON public.kudos
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =============================================

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admin can delete notifications" ON public.notifications
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role inserts (no restrictive INSERT policy = only service role can insert)

-- Enable realtime for kudos and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.kudos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================
-- Sprint 3: feed_reactions
-- =============================================

CREATE TABLE public.feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id, reaction)
);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view reactions" ON public.feed_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reactions" ON public.feed_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions" ON public.feed_reactions
  FOR DELETE USING (user_id = auth.uid());
