import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const UPSTREAM = 'https://laozvnaupdecerpvwzmh.supabase.co/functions/v1/caller-api';

const ALLOWED_ACTIONS = new Set([
  'meta',
  'list_interviews',
  'set_status',
  'send_panel_link',
  'send_reminder',
  'resend_success_email',
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await anon.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'Ungültiger Request-Body' }, 400);
    }

    const action = typeof payload.action === 'string' ? payload.action : '';
    if (!ALLOWED_ACTIONS.has(action)) {
      return json({ error: `Aktion nicht erlaubt: ${action || '(leer)'}` }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: emp, error: empErr } = await admin
      .from('employees')
      .select('id, outbound_recruitment, caller_api_key')
      .eq('user_id', userId)
      .maybeSingle();

    if (empErr) {
      console.error('employee lookup failed', empErr.message);
      return json({ error: 'Mitarbeiter konnte nicht geladen werden' }, 500);
    }
    if (!emp) return json({ error: 'Kein Mitarbeiter-Profil gefunden' }, 403);
    if (!emp.outbound_recruitment || !emp.caller_api_key) {
      return json({ error: 'Outbound Recruitment ist für diesen Account nicht aktiviert' }, 403);
    }

    const body = { ...payload };
    delete (body as Record<string, unknown>).action;

    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-caller-key': emp.caller_api_key as string,
      },
      body: JSON.stringify({ action, ...body }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error(`caller-api [${action}] failed [${upstream.status}]: ${text}`);
    }
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('caller-api-proxy error:', msg);
    return json({ error: msg }, 500);
  }
});
