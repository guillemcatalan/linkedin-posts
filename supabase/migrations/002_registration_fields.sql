-- ============================================
-- Add registration fields + LinkedIn tokens
-- ============================================

-- New columns on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nickname text DEFAULT '',
  ADD COLUMN IF NOT EXISTS role text DEFAULT '',
  ADD COLUMN IF NOT EXISTS role_description text DEFAULT '';

-- LinkedIn OAuth tokens (for publishing on behalf of users)
CREATE TABLE IF NOT EXISTS public.linkedin_tokens (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  linkedin_sub text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz NOT NULL,
  scopes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_tokens_sub ON public.linkedin_tokens(linkedin_sub);

ALTER TABLE public.linkedin_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage own tokens"
  ON public.linkedin_tokens FOR ALL
  USING (auth.uid() = user_id);
