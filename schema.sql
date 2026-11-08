-- Initial schema only. Run in Supabase SQL Editor after creating a project.
-- Do not store wallet balances in browser localStorage.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_user_id text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own basic profile"
  on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Wallet/ledger tables are intentionally not created here until secure
-- server-side functions and admin authorization rules are implemented.
