// Edge Function: sends a test Pushover notification.
// Called directly from the dashboard frontend via sb.functions.invoke().
// Requires the user to be authenticated (JWT verified).
// Secret required: PUSHOVER_TOKEN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PUSHOVER_TOKEN = Deno.env.get("PUSHOVER_TOKEN") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")   ?? "";
const SUPABASE_ANON  = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userSb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userSb.auth.getUser();
    if (authError || !user) return json({ error: "unauthorized" }, 401);

    const { pushover_user_key } = await req.json();
    if (!pushover_user_key?.trim())
      return json({ error: "No Pushover user key provided" }, 400);
    if (!PUSHOVER_TOKEN)
      return json({ error: "PUSHOVER_TOKEN secret not configured on the server" }, 500);

    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token:   PUSHOVER_TOKEN,
        user:    pushover_user_key.trim(),
        title:   "Motion · Test",
        message: "Pushover notifications are working correctly.",
      }),
    });

    const body = await res.json();
    if (!res.ok)
      return json({ error: body.errors?.join(", ") ?? "Pushover error" }, 502);

    return json({ ok: true });

  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
