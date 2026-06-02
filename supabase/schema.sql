-- Banker Builder initial Supabase schema
-- Run this in the Supabase SQL editor for the target project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  school text,
  graduation_year integer,
  major text,
  target_role text,
  created_at timestamptz not null default now()
);

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  firm_type text,
  prestige_rating numeric(2,1),
  pay_rating numeric(2,1),
  competitiveness_rating numeric(2,1),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.offices (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  city text not null,
  state text,
  address text,
  latitude double precision,
  longitude double precision,
  groups text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_odds_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inputs_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.target_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Target List',
  inputs_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.target_list_items (
  id uuid primary key default gen_random_uuid(),
  target_list_id uuid not null references public.target_lists(id) on delete cascade,
  firm_id uuid references public.firms(id) on delete set null,
  office_id uuid references public.offices(id) on delete set null,
  group_name text,
  bucket text check (bucket in ('Reach', 'Target', 'Safety')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.networking_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  firm text,
  office text,
  group_name text,
  title text,
  email text,
  linkedin_url text,
  status text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm text not null,
  role text,
  office text,
  group_name text,
  status text,
  deadline date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('general', 'interview_odds', 'target_list_builder', 'interview_prep')),
  feedback_type text not null check (
    feedback_type in (
      'bug',
      'confusing_experience',
      'inaccurate_result',
      'irrelevant_recommendation',
      'inaccurate_feedback',
      'suggestion',
      'other'
    )
  ),
  message text not null check (length(trim(message)) > 0),
  context_type text,
  related_table text,
  related_record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.firms enable row level security;
alter table public.offices enable row level security;
alter table public.interview_odds_results enable row level security;
alter table public.target_lists enable row level security;
alter table public.target_list_items enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.networking_contacts enable row level security;
alter table public.applications enable row level security;
alter table public.user_feedback enable row level security;

create policy "Anyone can read firms"
  on public.firms for select
  using (true);

create policy "Anyone can read offices"
  on public.offices for select
  using (true);

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

create policy "Users can read own interview odds results"
  on public.interview_odds_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own interview odds results"
  on public.interview_odds_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interview odds results"
  on public.interview_odds_results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own interview odds results"
  on public.interview_odds_results for delete
  using (auth.uid() = user_id);

create policy "Users can read own target lists"
  on public.target_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert own target lists"
  on public.target_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own target lists"
  on public.target_lists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own target lists"
  on public.target_lists for delete
  using (auth.uid() = user_id);

create policy "Users can read own target list items"
  on public.target_list_items for select
  using (
    exists (
      select 1 from public.target_lists
      where target_lists.id = target_list_items.target_list_id
        and target_lists.user_id = auth.uid()
    )
  );

create policy "Users can insert own target list items"
  on public.target_list_items for insert
  with check (
    exists (
      select 1 from public.target_lists
      where target_lists.id = target_list_items.target_list_id
        and target_lists.user_id = auth.uid()
    )
  );

create policy "Users can update own target list items"
  on public.target_list_items for update
  using (
    exists (
      select 1 from public.target_lists
      where target_lists.id = target_list_items.target_list_id
        and target_lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.target_lists
      where target_lists.id = target_list_items.target_list_id
        and target_lists.user_id = auth.uid()
    )
  );

create policy "Users can delete own target list items"
  on public.target_list_items for delete
  using (
    exists (
      select 1 from public.target_lists
      where target_lists.id = target_list_items.target_list_id
        and target_lists.user_id = auth.uid()
    )
  );

create policy "Users can read own resume analyses"
  on public.resume_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own resume analyses"
  on public.resume_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resume analyses"
  on public.resume_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own resume analyses"
  on public.resume_analyses for delete
  using (auth.uid() = user_id);

create policy "Users can read own networking contacts"
  on public.networking_contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert own networking contacts"
  on public.networking_contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own networking contacts"
  on public.networking_contacts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own networking contacts"
  on public.networking_contacts for delete
  using (auth.uid() = user_id);

create policy "Users can read own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

create policy "Users can insert own feedback"
  on public.user_feedback for insert
  with check (auth.uid() = user_id);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists offices_firm_id_idx on public.offices(firm_id);
create index if not exists interview_odds_results_user_id_idx on public.interview_odds_results(user_id);
create index if not exists target_lists_user_id_idx on public.target_lists(user_id);
create index if not exists target_list_items_target_list_id_idx on public.target_list_items(target_list_id);
create index if not exists resume_analyses_user_id_idx on public.resume_analyses(user_id);
create index if not exists networking_contacts_user_id_idx on public.networking_contacts(user_id);
create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists user_feedback_user_id_idx on public.user_feedback(user_id);
create index if not exists user_feedback_created_at_idx on public.user_feedback(created_at);
create index if not exists user_feedback_feature_idx on public.user_feedback(feature);
create index if not exists user_feedback_status_idx on public.user_feedback(status);
