-- Migration: per-user notify_settings with Pushover user key
-- Run once in the Supabase SQL editor.

-- Drop old single-row table
drop table if exists public.notify_settings;

-- Per-user settings
create table public.notify_settings (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  sensor_config     jsonb       not null default '{}',
  pushover_user_key text        not null default '',
  updated_at        timestamptz not null default now(),
  unique(user_id)
);

alter table public.notify_settings enable row level security;

-- Each user sees and edits only their own row
create policy "own select" on public.notify_settings
  for select using (auth.uid() = user_id);

create policy "own insert" on public.notify_settings
  for insert with check (auth.uid() = user_id);

create policy "own update" on public.notify_settings
  for update using (auth.uid() = user_id);

-- Service role (edge function) bypasses RLS — no extra policy needed.
-- Set the Pushover app token as a Supabase secret:
--   supabase secrets set PUSHOVER_TOKEN=your_app_token
