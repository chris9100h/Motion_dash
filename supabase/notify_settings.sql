-- Einstellungen für Pushover-Push-Benachrichtigungen.
-- Einmalig im Supabase SQL-Editor ausführen.

create table if not exists public.notify_settings (
  id              smallint primary key default 1,
  enabled_sensors integer[]   not null default '{}',
  window_start    smallint    not null default 22,
  window_end      smallint    not null default 6,
  updated_at      timestamptz not null default now(),
  constraint notify_settings_single_row check (id = 1)
);

-- Garantiert die eine Konfigurationszeile, die das Dashboard bearbeitet.
insert into public.notify_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.notify_settings enable row level security;

drop policy if exists "notify_settings read"   on public.notify_settings;
drop policy if exists "notify_settings update" on public.notify_settings;

-- Dashboard nutzt den anon-Key: Lesen + Aktualisieren der Konfigzeile erlauben.
create policy "notify_settings read"
  on public.notify_settings for select
  using (true);

create policy "notify_settings update"
  on public.notify_settings for update
  using (true) with check (true);
