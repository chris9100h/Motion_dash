-- Garage-Türzustände — History aller Events

-- Alte Tabelle/View entfernen falls vorhanden
drop table if exists public.door_status;
drop view if exists public.door_status;

create table if not exists public.door_events (
  id            bigserial primary key,
  door_name     text              not null,
  state         text              not null check (state in ('open', 'closed')),
  created_at    timestamptz       not null default now()
);

-- Nur der neueste Status pro Tür (für schnelle Abfragen)
create or replace view public.door_status as
  select distinct on (door_name) door_name, state, created_at
  from public.door_events
  order by door_name, created_at desc;

alter table public.door_events enable row level security;

drop policy if exists "door_events insert"  on public.door_events;
drop policy if exists "door_events select"  on public.door_events;

-- Öffentliche anon-Key darf eintragen und lesen
create policy "door_events insert"
  on public.door_events for insert
  with check (true);

create policy "door_events select"
  on public.door_events for select
  using (true);
