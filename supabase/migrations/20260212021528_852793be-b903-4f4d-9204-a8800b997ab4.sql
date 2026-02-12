ALTER TABLE public.objectives ADD COLUMN objective_type text NOT NULL DEFAULT 'quarterly';
COMMENT ON COLUMN public.objectives.objective_type IS 'Type of objective: annual, quarterly, monthly';