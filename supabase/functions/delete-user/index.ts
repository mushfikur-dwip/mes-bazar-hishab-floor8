import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("SUPABASE_URL:", supabaseUrl ? "set" : "missing");
    console.log("SERVICE_ROLE_KEY:", serviceRoleKey ? "set" : "missing");
    console.log("ANON_KEY:", anonKey ? "set" : "missing");

    // Verify caller using service role client with getUser(token)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    const { data: { user: caller }, error: userError } = await adminClient.auth.getUser(token);
    console.log("getUser result - caller:", caller?.id, "error:", userError?.message);
    
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role (adminClient already created above with service role)
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete related data first, then profile, then auth user
    const tables = [
      "meal_entries",
      "bazar_entries",
      "payments",
      "balance_ledger",
      "member_month_status",
      "bazar_rotation",
      "notifications",
      "user_roles",
    ];

    for (const table of tables) {
      await adminClient.from(table).delete().eq("user_id", user_id);
    }

    // Delete bazar_entries where bazar_by matches
    await adminClient.from("bazar_entries").delete().eq("bazar_by", user_id);

    // Delete profile
    await adminClient.from("profiles").delete().eq("id", user_id);

    // Delete auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(user_id);
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
