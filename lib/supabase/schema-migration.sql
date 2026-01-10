-- =========================================================
-- CLERK → SUPABASE AUTH MAPPING TABLE
-- =========================================================
-- This table maps Clerk user IDs to Supabase Auth user IDs
-- Created automatically via Clerk webhook when users sign up

create table if not exists public.clerk_user_mappings (
  clerk_user_id text primary key, -- Clerk user ID (e.g., "user_xxx")
  supabase_user_id uuid not null unique references auth.users(id) on delete cascade,
  email citext,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clerk_mappings_supabase_user on public.clerk_user_mappings(supabase_user_id);
create index if not exists idx_clerk_mappings_email on public.clerk_user_mappings(email);

drop trigger if exists trg_clerk_mappings_updated_at on public.clerk_user_mappings;
create trigger trg_clerk_mappings_updated_at
before update on public.clerk_user_mappings
for each row execute function public.set_updated_at();

-- Helper function: Get Supabase user ID from Clerk user ID
create or replace function public.get_supabase_user_id(p_clerk_user_id text)
returns uuid
language sql
stable
as $$
  select supabase_user_id
  from public.clerk_user_mappings
  where clerk_user_id = p_clerk_user_id;
$$;

-- Helper function: Get Clerk user ID from Supabase user ID
create or replace function public.get_clerk_user_id(p_supabase_user_id uuid)
returns text
language sql
stable
as $$
  select clerk_user_id
  from public.clerk_user_mappings
  where supabase_user_id = p_supabase_user_id;
$$;

-- RLS: Users can only see their own mapping
alter table public.clerk_user_mappings enable row level security;

drop policy if exists clerk_mappings_select_own on public.clerk_user_mappings;
create policy clerk_mappings_select_own
on public.clerk_user_mappings for select
using (
  supabase_user_id = auth.uid()
  or clerk_user_id = current_setting('app.clerk_user_id', true)::text
);

