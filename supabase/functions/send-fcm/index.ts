import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    
    // Check for generate mode
    if (body.action === 'generate-vapid') {
      const keys = webpush.generateVAPIDKeys()
      return new Response(JSON.stringify({
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    
    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      return new Response(JSON.stringify({ 
        error: 'VAPID keys not configured. Call with ?action=generate-vapid first.',
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

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

    const { title, message, user_ids } = body

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
        const subscription = JSON.parse(profile.fcm_token)
        console.log(`Sending to ${profile.id}, endpoint: ${subscription.endpoint}`)
        
        const payload = JSON.stringify({
          title,
          body: message,
          message,
        })

        await webpush.sendNotification(subscription, payload)
        results.push({ userId: profile.id, success: true })
        console.log(`Push sent successfully to ${profile.id}`)
      } catch (e: any) {
        console.error(`Push failed for ${profile.id}:`, e.statusCode, e.body, e.message)
        results.push({ userId: profile.id, success: false, error: `${e.statusCode || ''} ${e.message || String(e)}` })
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
