-- Migration: globales Zeitfenster durch per-Sensor-Konfiguration ersetzen.
-- Im Supabase SQL-Editor ausführen.

alter table public.notify_settings
  add column if not exists sensor_config jsonb not null default '{}'::jsonb;

alter table public.notify_settings
  drop column if exists enabled_sensors,
  drop column if exists window_start,
  drop column if exists window_end;
