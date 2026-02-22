import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Web Push with VAPID - using npm:web-push
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = 'BFMQo4XarRLWqUlFqvDPa7LnX9fC8z-6NOT6YbfzygeHkbV1VmwTSdJARM7900Rb6jdjgzZPuy7c7E1c-WiWKfk'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get('FIREBASE_FCM_KEY')
    if (!VAPID_PRIVATE_KEY) throw new Error('FIREBASE_FCM_KEY (VAPID private key) not configured')

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      'mailto:admin@meal-hisab.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { title, message, user_ids } = await req.json()

    if (!title || !message || !user_ids?.length) {
      return new Response(JSON.stringify({ error: 'Missing title, message or user_ids' }), { status: 400, headers: corsHeaders })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, fcm_token')
      .in('id', user_ids)
      .not('fcm_token', 'is', null)

    const results: { userId: string; success: boolean; error?: string }[] = []

    for (const profile of (profiles || [])) {
      try {
        // fcm_token now contains the full PushSubscription JSON
        const subscription = JSON.parse(profile.fcm_token)
        
        const payload = JSON.stringify({
          title,
          body: message,
          message,
        })

        await webpush.sendNotification(subscription, payload)
        results.push({ userId: profile.id, success: true })
      } catch (e: any) {
        console.error(`Push failed for ${profile.id}:`, e.message || e)
        results.push({ userId: profile.id, success: false, error: e.message || String(e) })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Send push error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
