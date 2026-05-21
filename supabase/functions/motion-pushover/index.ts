// Edge Function: sendet bei Bewegungs-Events eine Pushover-Nachricht.
// Ausgelöst per Database Webhook auf INSERT in public.motion_events.
//
// >>> VOR DEM DEPLOY: die beiden Platzhalter unten durch die echten
// >>> Pushover-Werte ersetzen. ACHTUNG: Das Repo ist öffentlich –
// >>> die ausgefüllte Datei nicht committen/pushen.
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Supabase automatisch bereit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PUSHOVER_TOKEN = "DEIN_PUSHOVER_APP_TOKEN"; // <-- ersetzen
const PUSHOVER_USER  = "DEIN_PUSHOVER_USER_KEY";  // <-- ersetzen
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "";
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

// true, wenn hour im Fenster liegt. start === end ⇒ ganztägig.
function inWindow(hour: number, start: number, end: number): boolean {
  if (start === end) return true;
  if (start < end)  return hour >= start && hour < end;
  return hour >= start || hour < end; // Fenster über Mitternacht
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const row = payload.record ?? payload.new ?? payload;

    if (!row || row.presence !== true) {
      return new Response("skip: kein Presence-Event", { status: 200 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: cfg, error } = await sb
      .from("notify_settings").select("*").eq("id", 1).maybeSingle();

    if (error || !cfg) {
      return new Response("skip: keine Einstellungen", { status: 200 });
    }

    const sensorId = Number(row.sensor_id);
    if (!cfg.enabled_sensors?.includes(sensorId)) {
      return new Response("skip: Sensor deaktiviert", { status: 200 });
    }

    const when = new Date(row.created_at ?? Date.now());
    if (!inWindow(viennaHour(when), cfg.window_start, cfg.window_end)) {
      return new Response("skip: außerhalb des Zeitraums", { status: 200 });
    }

    const name = SENSOR_NAMES[sensorId] ?? row.sensor_name ?? `Sensor ${sensorId}`;
    const time = new Intl.DateTimeFormat("de-AT", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit",
    }).format(when);

    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title: `Bewegung: ${name}`,
        message: `${name} – Bewegung erkannt um ${time} Uhr`,
      }),
    });

    if (!res.ok) {
      return new Response(`pushover-fehler: ${await res.text()}`, { status: 502 });
    }
    return new Response("gesendet", { status: 200 });
  } catch (e) {
    return new Response(`fehler: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
});
