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

-- Update trigger to read all registration fields from auth metadata
-- Only allow @factorial.co emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF new.email NOT LIKE '%@factorial.co' THEN
    RAISE EXCEPTION 'Only @factorial.co emails are allowed';
  END IF;

  INSERT INTO public.users (id, name, email, nickname, linkedin_url, department, role, role_description)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', ''),
    coalesce(new.raw_user_meta_data->>'linkedin_url', ''),
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'role_description', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
