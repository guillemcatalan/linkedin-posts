-- ============================================
-- Enrich LinkedIn data extraction
-- ============================================

-- Full position history (not just current)
CREATE TABLE IF NOT EXISTS public.user_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  description text DEFAULT '',
  location text DEFAULT '',
  started_on text DEFAULT '',
  finished_on text DEFAULT '',
  is_current boolean DEFAULT false
);

-- Education history
CREATE TABLE IF NOT EXISTS public.user_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  school text NOT NULL DEFAULT '',
  degree text DEFAULT '',
  field_of_study text DEFAULT '',
  started_on text DEFAULT '',
  finished_on text DEFAULT '',
  notes text DEFAULT ''
);

-- Professional certifications
CREATE TABLE IF NOT EXISTS public.user_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  authority text DEFAULT '',
  started_on text DEFAULT '',
  finished_on text DEFAULT '',
  url text DEFAULT ''
);

-- Projects
CREATE TABLE IF NOT EXISTS public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  started_on text DEFAULT '',
  finished_on text DEFAULT '',
  url text DEFAULT ''
);

-- Add languages to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages text DEFAULT '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_positions_user ON public.user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_user ON public.user_education(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_user ON public.user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON public.user_projects(user_id);

-- RLS
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage own positions" ON public.user_positions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage own education" ON public.user_education FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage own certifications" ON public.user_certifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage own projects" ON public.user_projects FOR ALL USING (auth.uid() = user_id);
