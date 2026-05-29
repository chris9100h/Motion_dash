-- 7-Tage-Datenaufbewahrung: alles älter als 7 Tage wird täglich gelöscht

-- pg_cron aktivieren
create extension if not exists pg_cron;

-- Tägliche Bereinigung motion_events um 03:00 UTC
select cron.schedule(
  'cleanup-motion-events',
  '0 3 * * *',
  $$delete from motion_events where created_at < now() - interval '7 days'$$
);

-- Tägliche Bereinigung door_events um 03:00 UTC
select cron.schedule(
  'cleanup-door-events',
  '0 3 * * *',
  $$delete from door_events where created_at < now() - interval '7 days'$$
);

-- Einmalige Sofortbereinigung bestehender alter Einträge
delete from motion_events where created_at < now() - interval '7 days';
delete from door_events where created_at < now() - interval '7 days';
