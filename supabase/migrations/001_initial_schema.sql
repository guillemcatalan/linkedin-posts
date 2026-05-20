-- ============================================
-- Factorial Posts — Initial Schema
-- ============================================

-- Users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null unique,
  linkedin_url text default '',
  department text default '',
  created_at timestamptz default now()
);

-- Generated posts (core)
create table public.generated_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  input_idea text not null,
  variant_1 text default '',
  variant_2 text default '',
  variant_3 text default '',
  selected_variant integer,
  status text default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Post engagement metrics
create table public.post_engagement (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.generated_posts(id) on delete cascade,
  likes integer default 0,
  comments integer default 0,
  views integer default 0,
  updated_at timestamptz default now()
);

-- User posts imported from LinkedIn ZIP
create table public.user_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_text text not null,
  post_date timestamptz,
  likes integer default 0,
  comments integer default 0
);

-- User writing style analysis
create table public.user_style (
  user_id uuid primary key references public.users(id) on delete cascade,
  tone text default '',
  avg_word_count integer default 0,
  emoji_usage text default 'none',
  common_topics text default '',
  writing_notes text default ''
);

-- LinkedIn profile data
create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  headline text default '',
  about text default '',
  role_title text default '',
  company text default '',
  location text default ''
);

-- Indexes
create index idx_generated_posts_user on public.generated_posts(user_id);
create index idx_generated_posts_status on public.generated_posts(status);
create index idx_user_posts_user on public.user_posts(user_id);
create index idx_post_engagement_post on public.post_engagement(post_id);

-- ============================================
-- Trigger: auto-create user row on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Row Level Security
-- ============================================
alter table public.users enable row level security;
alter table public.generated_posts enable row level security;
alter table public.post_engagement enable row level security;
alter table public.user_posts enable row level security;
alter table public.user_style enable row level security;
alter table public.profiles enable row level security;

-- Users: authenticated can read all (for feed), update own
create policy "read all users"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "update own user"
  on public.users for update
  using (auth.uid() = id);

-- Generated posts: published visible to all, drafts only to owner
create policy "read posts"
  on public.generated_posts for select
  using (status = 'published' or auth.uid() = user_id);

create policy "insert own posts"
  on public.generated_posts for insert
  with check (auth.uid() = user_id);

create policy "update own posts"
  on public.generated_posts for update
  using (auth.uid() = user_id);

-- Engagement: readable by all authenticated
create policy "read engagement"
  on public.post_engagement for select
  using (true);

create policy "insert engagement"
  on public.post_engagement for insert
  with check (true);

create policy "update engagement"
  on public.post_engagement for update
  using (true);

-- User posts (LinkedIn imports): owner only
create policy "manage own user_posts"
  on public.user_posts for all
  using (auth.uid() = user_id);

-- User style: owner only
create policy "manage own style"
  on public.user_style for all
  using (auth.uid() = user_id);

-- Profiles: owner only
create policy "manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id);
