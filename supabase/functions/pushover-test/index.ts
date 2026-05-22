// Edge Function: sends a test Pushover notification.
// Called directly from the dashboard frontend via sb.functions.invoke().
// Requires the user to be authenticated (JWT verified).
// Secret required: PUSHOVER_TOKEN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PUSHOVER_TOKEN = Deno.env.get("PUSHOVER_TOKEN") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")   ?? "";
const SUPABASE_ANON  = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: corsHeaders });
    }
    const userSb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userSb.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: corsHeaders });
    }

    const { pushover_user_key } = await req.json();
    if (!pushover_user_key?.trim()) {
      return new Response(JSON.stringify({ error: "No Pushover user key provided" }),
        { status: 400, headers: corsHeaders });
    }
    if (!PUSHOVER_TOKEN) {
      return new Response(JSON.stringify({ error: "PUSHOVER_TOKEN secret not set" }),
        { status: 500, headers: corsHeaders });
    }

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
    if (!res.ok) {
      return new Response(JSON.stringify({ error: body.errors?.join(", ") ?? "Pushover error" }),
        { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: corsHeaders });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
