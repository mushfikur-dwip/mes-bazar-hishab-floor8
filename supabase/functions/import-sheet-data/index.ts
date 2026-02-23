import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 8 members
    const members = [
      { email: "ayon@meal.local", name: "AYON" },
      { email: "sami@meal.local", name: "SAMI" },
      { email: "fahad@meal.local", name: "FAHAD" },
      { email: "mahfuz@meal.local", name: "MAHFUZ" },
      { email: "doha@meal.local", name: "DOHA" },
      { email: "jesun@meal.local", name: "JESUN" },
      { email: "nishat@meal.local", name: "NISHAT" },
      { email: "rabbi@meal.local", name: "RABBI" },
    ];

    const password = "Meal@2026";
    const userMap: Record<string, string> = {}; // name -> user_id

    // Step 1: Create auth users
    for (const m of members) {
      const { data, error } = await admin.auth.admin.createUser({
        email: m.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: m.name },
      });
      if (error) {
        // If user already exists, find them
        if (error.message?.includes("already been registered")) {
          const { data: listData } = await admin.auth.admin.listUsers();
          const existing = listData?.users?.find((u: any) => u.email === m.email);
          if (existing) {
            userMap[m.name] = existing.id;
            // Update profile name
            await admin.from("profiles").update({ full_name: m.name }).eq("id", existing.id);
            console.log(`User ${m.name} already exists: ${existing.id}`);
            continue;
          }
        }
        console.error(`Error creating ${m.name}:`, error.message);
        continue;
      }
      userMap[m.name] = data.user.id;
      // Update profile name (trigger may have already created it)
      await admin.from("profiles").update({ full_name: m.name }).eq("id", data.user.id);
      console.log(`Created ${m.name}: ${data.user.id}`);
    }

    console.log("User map:", userMap);

    const monthKey = "2024-11";

    // Step 2: Meal entries (x = no meal, number = meal count, 2 = guest included)
    // Format: [day, [lunch, dinner, lunch_guest, dinner_guest]] per member
    type MealDay = [number, number, number, number]; // lunch, dinner, lunch_guest, dinner_guest
    const mealData: Record<string, Record<number, MealDay>> = {
      AYON:   { 9:[0,0,0,0], 10:[0,0,0,0], 11:[0,0,0,0], 12:[0,1,0,0], 13:[1,1,1,1], 14:[1,1,1,0], 15:[1,1,0,0], 16:[1,1,0,0], 17:[1,1,0,0], 18:[1,1,0,0], 19:[0,0,0,0], 20:[0,1,0,0], 21:[0,0,0,0] },
      SAMI:   { 9:[1,1,0,0], 10:[1,1,0,0], 11:[0,0,0,0], 12:[0,0,0,0], 13:[0,0,0,0], 14:[0,0,0,0], 15:[0,0,0,0], 16:[0,0,0,0], 17:[0,0,0,0], 18:[0,0,0,0], 19:[0,0,0,0], 20:[0,0,0,0], 21:[1,0,0,0] },
      FAHAD:  { 9:[1,1,0,0], 10:[1,0,0,0], 11:[0,0,0,0], 12:[0,0,0,0], 13:[0,0,0,0], 14:[0,0,0,0], 15:[0,0,0,0], 16:[0,0,0,0], 17:[0,0,0,0], 18:[0,0,0,0], 19:[0,0,0,0], 20:[1,1,0,0], 21:[1,1,0,0] },
      MAHFUZ: { 9:[1,1,0,0], 10:[1,1,0,0], 11:[1,1,0,0], 12:[1,0,0,0], 13:[1,0,0,0], 14:[1,1,0,0], 15:[1,0,0,0], 16:[1,0,0,0], 17:[1,1,0,0], 18:[1,1,0,0], 19:[1,1,0,0], 20:[1,1,0,0], 21:[0,0,0,0] },
      DOHA:   { 9:[0,0,0,0], 10:[0,0,0,0], 11:[0,0,0,0], 12:[0,0,0,0], 13:[0,0,0,0], 14:[0,0,0,0], 15:[0,0,0,0], 16:[0,0,0,0], 17:[0,0,0,0], 18:[1,0,0,0], 19:[0,0,0,0], 20:[0,0,0,0], 21:[0,0,0,0] },
      JESUN:  { 9:[0,0,0,0], 10:[0,0,0,0], 11:[0,0,0,0], 12:[0,0,0,0], 13:[0,0,0,0], 14:[0,0,0,0], 15:[0,0,0,0], 16:[0,0,0,0], 17:[0,0,0,0], 18:[0,0,0,0], 19:[0,0,0,0], 20:[1,0,0,0], 21:[0,1,0,0] },
      NISHAT: { 9:[1,1,0,0], 10:[1,1,0,0], 11:[0,1,0,0], 12:[0,1,0,0], 13:[0,1,0,0], 14:[1,1,0,0], 15:[1,1,0,0], 16:[1,1,0,0], 17:[0,1,0,0], 18:[0,0,0,0], 19:[0,1,0,0], 20:[0,1,0,0], 21:[0,0,0,0] },
      RABBI:  { 9:[0,0,0,0], 10:[0,0,0,0], 11:[0,0,0,0], 12:[1,1,0,0], 13:[1,1,0,0], 14:[1,1,0,0], 15:[1,1,0,0], 16:[1,1,0,0], 17:[1,1,0,0], 18:[1,1,0,0], 19:[1,1,0,0], 20:[1,1,0,0], 21:[0,0,0,0] },
    };

    const mealRows: any[] = [];
    for (const [name, days] of Object.entries(mealData)) {
      const userId = userMap[name];
      if (!userId) { console.log(`Skipping meals for ${name} - no user id`); continue; }
      for (const [day, [lunch, dinner, lguest, dguest]] of Object.entries(days)) {
        const date = `2024-11-${String(Number(day)).padStart(2, "0")}`;
        mealRows.push({
          user_id: userId,
          date,
          month_key: monthKey,
          breakfast: false,
          lunch: lunch > 0,
          dinner: dinner > 0,
          breakfast_guest_count: 0,
          lunch_guest_count: lguest,
          dinner_guest_count: dguest,
        });
      }
    }

    if (mealRows.length > 0) {
      const { error } = await admin.from("meal_entries").insert(mealRows);
      if (error) console.error("Meal insert error:", error.message);
      else console.log(`Inserted ${mealRows.length} meal entries`);
    }

    // Step 3: Bazar entries
    const bazarEntries = [
      { date: "2024-11-08", name: "MAHFUZ", amount: 4485 },
      { date: "2024-11-13", name: "AYON", amount: 70 },
      { date: "2024-11-15", name: "AYON", amount: 2140, description: "Ayon/Jesun" },
    ];

    for (const b of bazarEntries) {
      const bazarBy = userMap[b.name];
      if (!bazarBy) { console.log(`Skipping bazar for ${b.name}`); continue; }
      const { error } = await admin.from("bazar_entries").insert({
        date: b.date,
        month_key: monthKey,
        amount: b.amount,
        bazar_by: bazarBy,
        description: b.description || "",
      });
      if (error) console.error(`Bazar insert error for ${b.name}:`, error.message);
      else console.log(`Inserted bazar for ${b.name}: ${b.amount}`);
    }

    // Step 4: Payments
    const payments = [
      { name: "FAHAD", amount: 1500 },
      { name: "JESUN", amount: 2000 },
      { name: "AYON", amount: 2000 },
      { name: "SAMI", amount: 1000 },
      { name: "NISHAT", amount: 1000 },
      { name: "RABBI", amount: 1500 },
    ];

    for (const p of payments) {
      const userId = userMap[p.name];
      if (!userId) { console.log(`Skipping payment for ${p.name}`); continue; }
      const { error } = await admin.from("payments").insert({
        user_id: userId,
        date: "2024-11-15",
        month_key: monthKey,
        amount: p.amount,
      });
      if (error) console.error(`Payment insert error for ${p.name}:`, error.message);
      else console.log(`Inserted payment for ${p.name}: ${p.amount}`);
    }

    // Step 5: Member month status (all active for 2024-11)
    for (const [name, userId] of Object.entries(userMap)) {
      const { error } = await admin.from("member_month_status").insert({
        user_id: userId,
        month_key: monthKey,
        is_active: true,
      });
      if (error) console.error(`Status insert error for ${name}:`, error.message);
    }

    return new Response(
      JSON.stringify({ success: true, users: userMap, meals: mealRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
