-- Garage-Türzustände. Wird vom Bash-Skript per REST-API gefüllt.
create table if not exists public.door_events (
  id            bigserial primary key,
  door_name     text              not null,
  state         text              not null check (state in ('open', 'closed')),
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now()
);

-- Nur die neueste Änderung pro Tür
create or replace view public.door_status as
  select distinct on (door_name) door_name, state, created_at
  from public.door_events
  order by door_name, created_at desc;

alter table public.door_events enable row level security;

drop policy if exists "door_events insert"  on public.door_events;
drop policy if exists "door_events select"  on public.door_events;

-- Öffentliche anon-Key darf eintragen (von Bash) und lesen (Dashboard).
create policy "door_events insert"
  on public.door_events for insert
  with check (true);

create policy "door_events select"
  on public.door_events for select
  using (true);
