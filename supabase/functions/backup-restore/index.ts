import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TABLES = [
  "meal_entries",
  "bazar_entries",
  "payments",
  "extra_costs",
  "balance_ledger",
  "meal_weight_settings",
  "meal_cutoff_settings",
  "member_month_status",
  "bazar_rotation",
];

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");

  const userId = data.claims.sub as string;

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) throw new Error("Forbidden: Admin only");

  return adminClient;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = await verifyAdmin(req);

    if (req.method === "GET") {
      const backup: Record<string, unknown[]> = {};

      for (const table of TABLES) {
        const { data, error } = await adminClient.from(table).select("*");
        if (error) throw error;
        backup[table] = data || [];
      }

      // profiles: only name & phone
      const { data: profiles, error: pErr } = await adminClient
        .from("profiles")
        .select("id, full_name, phone");
      if (pErr) throw pErr;
      backup.profiles = profiles || [];

      return new Response(JSON.stringify(backup, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (!body || typeof body !== "object") {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: Record<string, string> = {};

      for (const table of TABLES) {
        if (!body[table] || !Array.isArray(body[table]) || body[table].length === 0) {
          results[table] = "skipped";
          continue;
        }
        const { error } = await adminClient.from(table).upsert(body[table], { onConflict: "id" });
        if (error) {
          results[table] = `error: ${error.message}`;
        } else {
          results[table] = `${body[table].length} rows`;
        }
      }

      // profiles update (only name & phone)
      if (body.profiles && Array.isArray(body.profiles)) {
        for (const p of body.profiles) {
          if (!p.id) continue;
          await adminClient
            .from("profiles")
            .update({ full_name: p.full_name, phone: p.phone })
            .eq("id", p.id);
        }
        results.profiles = `${body.profiles.length} rows`;
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Unauthorized" || message.startsWith("Forbidden") ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
