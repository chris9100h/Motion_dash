// Edge Function: sends a Pushover notification on motion events.
// Triggered via Database Webhook on INSERT into public.motion_events.
//
// Required secrets (set via Supabase dashboard or CLI):
//   PUSHOVER_TOKEN  — your Pushover application token
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PUSHOVER_TOKEN = Deno.env.get("PUSHOVER_TOKEN") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")   ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TZ = "Europe/Vienna";

const SENSOR_NAMES: Record<number, string> = {
  83: "Galerie", 57: "Haustür", 143: "Keller", 95: "Vorhaus",
};

function viennaHour(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", hour12: false,
  }).format(d)) % 24;
}

function inWindow(hour: number, start: number, end: number): boolean {
  if (start === end) return true;
  if (start < end)  return hour >= start && hour < end;
  return hour >= start || hour < end;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const row = payload.record ?? payload.new ?? payload;

    if (!row || row.presence !== true) {
      return new Response("skip: no presence event", { status: 200 });
    }

    if (!PUSHOVER_TOKEN) {
      return new Response("skip: PUSHOVER_TOKEN not set", { status: 200 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load all users' notification settings
    const { data: allSettings, error } = await sb
      .from("notify_settings")
      .select("pushover_user_key, sensor_config");

    if (error || !allSettings?.length) {
      return new Response("skip: no settings", { status: 200 });
    }

    const sensorId  = Number(row.sensor_id);
    const when      = new Date(row.created_at ?? Date.now());
    const hourNow   = viennaHour(when);
    const name      = SENSOR_NAMES[sensorId] ?? row.sensor_name ?? `Sensor ${sensorId}`;
    const time      = new Intl.DateTimeFormat("de-AT", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit",
    }).format(when);

    const sends: Promise<void>[] = [];

    for (const cfg of allSettings) {
      if (!cfg.pushover_user_key) continue;

      const sensorCfg = (cfg.sensor_config ?? {})[String(sensorId)];
      if (!sensorCfg?.enabled) continue;
      if (!inWindow(hourNow, sensorCfg.window_start, sensorCfg.window_end)) continue;

      sends.push(
        fetch("https://api.pushover.net/1/messages.json", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token:   PUSHOVER_TOKEN,
            user:    cfg.pushover_user_key,
            title:   `Bewegung: ${name}`,
            message: `${name} – Bewegung erkannt um ${time} Uhr`,
          }),
        }).then(() => {})
      );
    }

    await Promise.all(sends);

    return new Response(`sent to ${sends.length} user(s)`, { status: 200 });
  } catch (e) {
    return new Response(`error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
});
