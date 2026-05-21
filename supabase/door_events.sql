-- Garage-Türzustände — History aller Events

create table if not exists public.door_events (
  id            bigserial primary key,
  door_name     text              not null,
  state         text              not null check (state in ('open', 'closed')),
  created_at    timestamptz       not null default now()
);

alter table public.door_events enable row level security;

-- Realtime aktivieren, damit das Dashboard neue Einträge sofort sieht
alter publication supabase_realtime add table public.door_events;

drop policy if exists "door_events insert"  on public.door_events;
drop policy if exists "door_events select"  on public.door_events;

-- Öffentliche anon-Key darf eintragen und lesen
create policy "door_events insert"
  on public.door_events for insert
  with check (true);

create policy "door_events select"
  on public.door_events for select
  using (true);
