import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const reminderType = body.type as string

    if (!reminderType) {
      return new Response(JSON.stringify({ error: 'Missing reminder type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')

    if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@meal-hisab.app',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get current date in UTC+6
    const now = new Date()
    const bdTime = new Date(now.getTime() + 6 * 60 * 60 * 1000)
    const todayStr = bdTime.toISOString().slice(0, 10)
    const monthKey = bdTime.toISOString().slice(0, 7)
    const dayOfMonth = bdTime.getDate()
    const dayOfWeek = bdTime.getDay() // 0=Sun

    let result: any = { type: reminderType }

    switch (reminderType) {
      case 'meal_cutoff_breakfast':
      case 'meal_cutoff_lunch':
      case 'meal_cutoff_dinner': {
        result = await handleMealCutoffReminder(supabase, reminderType, monthKey, todayStr)
        break
      }
      case 'negative_balance': {
        result = await handleNegativeBalanceReminder(supabase, monthKey)
        break
      }
      case 'bazar_rotation': {
        result = await handleBazarRotationReminder(supabase, monthKey, todayStr)
        break
      }
      case 'monthly_summary': {
        result = await handleMonthlySummary(supabase, monthKey, dayOfMonth, bdTime)
        break
      }
      case 'new_month': {
        result = await handleNewMonthReminder(supabase, monthKey)
        break
      }
      case 'extra_expense': {
        result = await handleExtraExpenseReminder(supabase, monthKey)
        break
      }
      case 'daily_meal_summary': {
        result = await handleDailyMealSummary(supabase, monthKey, todayStr)
        break
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown type: ${reminderType}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Reminder error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ─── Helper: Send push + in-app notification ───
async function sendNotifications(
  supabase: any,
  userIds: string[],
  title: string,
  message: string,
  monthKey: string
) {
  if (!userIds.length) return { sent: 0 }

  // In-app notifications
  const notifications = userIds.map(uid => ({
    user_id: uid,
    title,
    message,
    type: 'reminder',
    month_key: monthKey,
  }))
  await supabase.from('notifications').insert(notifications)

  // Push notifications
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, fcm_token')
    .in('id', userIds)
    .not('fcm_token', 'is', null)

  let pushSent = 0
  for (const profile of (profiles || [])) {
    try {
      const subscription = JSON.parse(profile.fcm_token)
      await webpush.sendNotification(subscription, JSON.stringify({ title, body: message, message }))
      pushSent++
    } catch (e: any) {
      console.error(`Push failed for ${profile.id}:`, e.message)
    }
  }

  // Telegram
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (TELEGRAM_BOT_TOKEN) {
    const { data: tgProfiles } = await supabase
      .from('profiles')
      .select('id, telegram_chat_id')
      .in('id', userIds)
      .not('telegram_chat_id', 'is', null)

    for (const p of (tgProfiles || [])) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: p.telegram_chat_id, text: `*${title}*\n${message}`, parse_mode: 'Markdown' }),
        })
      } catch (e) {
        console.error(`Telegram failed for ${p.id}`)
      }
    }
  }

  return { sent: userIds.length, pushSent }
}

// ─── Helper: Get active member IDs ───
async function getActiveMembers(supabase: any, monthKey: string): Promise<string[]> {
  const { data } = await supabase
    .from('member_month_status')
    .select('user_id')
    .eq('month_key', monthKey)
    .eq('is_active', true)
  return (data || []).map((d: any) => d.user_id)
}

// ─── Helper: Get admin IDs ───
async function getAdminIds(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
  return (data || []).map((d: any) => d.user_id)
}

// ─── 1. Meal Cutoff Reminder ───
async function handleMealCutoffReminder(supabase: any, type: string, monthKey: string, todayStr: string) {
  const mealType = type.replace('meal_cutoff_', '')
  const mealLabel = mealType === 'breakfast' ? 'সকালের নাস্তা' : mealType === 'lunch' ? 'দুপুরের খাবার' : 'রাতের খাবার'

  // Get members who haven't set their meal for today/tomorrow
  const activeMembers = await getActiveMembers(supabase, monthKey)
  if (!activeMembers.length) return { type, skipped: 'no active members' }

  // Check who already has entries
  const targetDate = mealType === 'breakfast' ? getNextDay(todayStr) : todayStr
  const { data: existingEntries } = await supabase
    .from('meal_entries')
    .select('user_id, ' + mealType)
    .eq('date', targetDate)
    .eq('month_key', monthKey)
    .in('user_id', activeMembers)

  // Members with no entry at all get reminded
  const enteredIds = new Set((existingEntries || []).map((e: any) => e.user_id))
  const missingMembers = activeMembers.filter((id: string) => !enteredIds.has(id))

  if (!missingMembers.length) return { type, skipped: 'all members have set meals' }

  const title = `⏰ ${mealLabel} কাটঅফ রিমাইন্ডার`
  const message = `আজকের ${mealLabel} এর কাটঅফ টাইম শীঘ্রই শেষ হচ্ছে। এখনই মিল আপডেট করুন!`

  return await sendNotifications(supabase, missingMembers, title, message, monthKey)
}

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// ─── 2. Negative Balance Payment Reminder ───
async function handleNegativeBalanceReminder(supabase: any, monthKey: string) {
  const { data: balances } = await supabase
    .from('balance_ledger')
    .select('user_id, closing_balance')
    .eq('month_key', monthKey)
    .lt('closing_balance', 0)

  if (!balances?.length) return { type: 'negative_balance', skipped: 'no negative balances' }

  const results = []
  for (const b of balances) {
    const amount = Math.abs(b.closing_balance)
    const title = '💰 পেমেন্ট রিমাইন্ডার'
    const message = `আপনার বর্তমান ব্যালেন্স -৳${amount.toFixed(0)}। অনুগ্রহ করে দ্রুত পেমেন্ট করুন।`
    await sendNotifications(supabase, [b.user_id], title, message, monthKey)
    results.push(b.user_id)
  }

  return { type: 'negative_balance', reminded: results.length }
}

// ─── 3. Bazar Rotation Reminder ───
async function handleBazarRotationReminder(supabase: any, monthKey: string, todayStr: string) {
  // Find who already did bazar entries so far this month
  const { data: bazarEntries } = await supabase
    .from('bazar_entries')
    .select('bazar_by')
    .eq('month_key', monthKey)
    .not('bazar_by', 'is', null)

  const doneBySet = new Set((bazarEntries || []).map((e: any) => e.bazar_by))

  // Get rotation order
  const { data: rotation } = await supabase
    .from('bazar_rotation')
    .select('user_id, sort_order')
    .eq('month_key', monthKey)
    .order('sort_order', { ascending: true })

  if (!rotation?.length) return { type: 'bazar_rotation', skipped: 'no rotation set' }

  // Find next person in rotation who hasn't done bazar recently
  // Simple: count entries per person, find the one with least
  const countMap: Record<string, number> = {}
  for (const r of rotation) countMap[r.user_id] = 0
  for (const e of (bazarEntries || [])) {
    if (e.bazar_by && countMap[e.bazar_by] !== undefined) countMap[e.bazar_by]++
  }

  // Sort by count ascending, then by sort_order
  const sorted = rotation.sort((a: any, b: any) => {
    const diff = (countMap[a.user_id] || 0) - (countMap[b.user_id] || 0)
    return diff !== 0 ? diff : a.sort_order - b.sort_order
  })

  const nextPerson = sorted[0]
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', nextPerson.user_id)
    .single()

  const title = '🛒 বাজার রিমাইন্ডার'
  const message = `আজ বাজারের পালা: ${profile?.full_name || 'Unknown'}। অনুগ্রহ করে বাজার করুন!`

  // Notify the person + all active members
  const activeMembers = await getActiveMembers(supabase, monthKey)
  return await sendNotifications(supabase, activeMembers, title, message, monthKey)
}

// ─── 4. Monthly Summary ───
async function handleMonthlySummary(supabase: any, monthKey: string, dayOfMonth: number, bdTime: Date) {
  // Only send on last day of month
  const lastDay = new Date(bdTime.getFullYear(), bdTime.getMonth() + 1, 0).getDate()
  if (dayOfMonth !== lastDay) return { type: 'monthly_summary', skipped: 'not last day' }

  const activeMembers = await getActiveMembers(supabase, monthKey)

  // Get total bazar
  const { data: bazarData } = await supabase
    .from('bazar_entries')
    .select('amount')
    .eq('month_key', monthKey)
  const totalBazar = (bazarData || []).reduce((s: number, e: any) => s + Number(e.amount), 0)

  // Get total meals count
  const { data: mealData } = await supabase
    .from('meal_entries')
    .select('breakfast, lunch, dinner')
    .eq('month_key', monthKey)
  const totalMeals = (mealData || []).reduce((s: number, e: any) => {
    return s + (e.breakfast ? 1 : 0) + (e.lunch ? 1 : 0) + (e.dinner ? 1 : 0)
  }, 0)

  const title = '📊 মাসিক সারাংশ'
  const message = `${monthKey} মাসের সারাংশ:\n মোট বাজার: ৳${totalBazar.toFixed(0)}\n মোট মিল: ${totalMeals}\n সদস্য: ${activeMembers.length} জন`

  return await sendNotifications(supabase, activeMembers, title, message, monthKey)
}

// ─── 5. New Month Start Reminder (Admin) ───
async function handleNewMonthReminder(supabase: any, monthKey: string) {
  const adminIds = await getAdminIds(supabase)
  if (!adminIds.length) return { type: 'new_month', skipped: 'no admins' }

  const title = '🗓️ নতুন মাস শুরু'
  const message = `${monthKey} মাস শুরু হয়েছে। অনুগ্রহ করে নতুন মাসের সেটিংস কনফিগার করুন — সদস্য স্ট্যাটাস, মিল ওয়েট, বাজার রোটেশন ইত্যাদি।`

  return await sendNotifications(supabase, adminIds, title, message, monthKey)
}

// ─── 6. Extra Expense Reminder (Admin) ───
async function handleExtraExpenseReminder(supabase: any, monthKey: string) {
  const adminIds = await getAdminIds(supabase)
  if (!adminIds.length) return { type: 'extra_expense', skipped: 'no admins' }

  const title = '💡 অতিরিক্ত খরচ রিমাইন্ডার'
  const message = `মাস শেষ হতে চলেছে। গ্যাস, বিদ্যুৎ, পানি ইত্যাদি বিল যোগ করতে ভুলবেন না!`

  return await sendNotifications(supabase, adminIds, title, message, monthKey)
}

// ─── 7. Daily Meal Summary (Admin) ───
async function handleDailyMealSummary(supabase: any, monthKey: string, todayStr: string) {
  const adminIds = await getAdminIds(supabase)
  if (!adminIds.length) return { type: 'daily_meal_summary', skipped: 'no admins' }

  const { data: meals } = await supabase
    .from('meal_entries')
    .select('breakfast, lunch, dinner, breakfast_guest_count, lunch_guest_count, dinner_guest_count')
    .eq('date', todayStr)
    .eq('month_key', monthKey)

  let breakfast = 0, lunch = 0, dinner = 0
  for (const m of (meals || [])) {
    if (m.breakfast) breakfast += 1 + (m.breakfast_guest_count || 0)
    if (m.lunch) lunch += 1 + (m.lunch_guest_count || 0)
    if (m.dinner) dinner += 1 + (m.dinner_guest_count || 0)
  }

  const title = '📋 আজকের মিল সারাংশ'
  const message = `${todayStr}\nসকাল: ${breakfast} জন | দুপুর: ${lunch} জন | রাত: ${dinner} জন`

  return await sendNotifications(supabase, adminIds, title, message, monthKey)
}
