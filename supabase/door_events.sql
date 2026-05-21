-- Garage-Türzustände. Wird vom Bash-Skript per REST-API gefüllt.
-- Speichert nur den neuesten Status pro Tür.
create table if not exists public.door_status (
  door_name     text              primary key,
  state         text              not null check (state in ('open', 'closed')),
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now()
);

alter table public.door_status enable row level security;

drop policy if exists "door_status insert"  on public.door_status;
drop policy if exists "door_status select"  on public.door_status;

-- Öffentliche anon-Key darf lesen und schreiben (vom Bash-Skript und Dashboard).
create policy "door_status insert"
  on public.door_status for insert
  with check (true);

create policy "door_status select"
  on public.door_status for select
  using (true);

create policy "door_status update"
  on public.door_status for update
  using (true) with check (true);
