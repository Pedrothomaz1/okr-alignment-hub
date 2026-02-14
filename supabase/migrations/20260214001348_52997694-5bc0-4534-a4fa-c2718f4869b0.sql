
-- Novos campos em kr_checkins
ALTER TABLE public.kr_checkins ADD COLUMN confidence text DEFAULT 'neutral';
ALTER TABLE public.kr_checkins ADD COLUMN difficulties text;

-- Tabela de comentarios no feed
CREATE TABLE public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES public.audit_logs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver comentarios
CREATE POLICY "Authenticated can view activity_comments"
ON public.activity_comments
FOR SELECT
USING (true);

-- Autenticados podem inserir seus proprios comentarios
CREATE POLICY "Authenticated can insert own activity_comments"
ON public.activity_comments
FOR INSERT
WITH CHECK (author_id = auth.uid());

-- Admin pode deletar comentarios
CREATE POLICY "Admin can delete activity_comments"
ON public.activity_comments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Autor pode deletar seus proprios comentarios
CREATE POLICY "Author can delete own activity_comments"
ON public.activity_comments
FOR DELETE
USING (author_id = auth.uid());
