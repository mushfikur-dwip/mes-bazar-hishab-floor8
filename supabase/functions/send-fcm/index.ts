import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const FIREBASE_FCM_KEY = Deno.env.get('FIREBASE_FCM_KEY')
    if (!FIREBASE_FCM_KEY) throw new Error('FIREBASE_FCM_KEY not configured')

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
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${FIREBASE_FCM_KEY}`,
          },
          body: JSON.stringify({
            to: profile.fcm_token,
            notification: { title, body: message },
            data: { title, message },
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          results.push({ userId: profile.id, success: false, error: JSON.stringify(data) })
        } else {
          results.push({ userId: profile.id, success: true })
        }
      } catch (e) {
        results.push({ userId: profile.id, success: false, error: String(e) })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
