import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(
    authHeader.slice(7),
  );
  const uid = claimsData?.claims?.sub;
  if (claimsErr || !uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { contract_id?: string };
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Ungültiger Body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const contractId = body.contract_id;
  if (!contractId || typeof contractId !== 'string') {
    return new Response(JSON.stringify({ error: 'contract_id fehlt' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: contract, error: cErr } = await supabase
    .from('employee_contracts')
    .select(
      'id, status, signed_at, employee:employees(user_id, first_name, last_name, contract_type, salary), template:contract_templates(title)',
    )
    .eq('id', contractId)
    .maybeSingle();

  if (cErr) {
    console.error('contract query failed', cErr);
    return new Response(JSON.stringify({ error: cErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const emp = (contract as any)?.employee as
    | {
        user_id: string | null;
        first_name: string | null;
        last_name: string | null;
        contract_type: string | null;
        salary: number | null;
      }
    | null;

  if (!contract || !emp || emp.user_id !== uid) {
    return new Response(JSON.stringify({ error: 'Nicht gefunden' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if ((contract as any).status !== 'pending_admin') {
    return new Response(JSON.stringify({ ok: true, skipped: 'status' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-notify-secret': Deno.env.get('TELEGRAM_NOTIFY_SECRET') ?? '',
      },
      body: JSON.stringify({
        type: 'contract',
        payload: {
          contract_id: contract.id,
          vorname: emp.first_name,
          nachname: emp.last_name,
          template_title: (contract as any).template?.title ?? null,
          contract_type: emp.contract_type,
          salary: emp.salary,
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`telegram-notify failed [${res.status}]: ${text}`);
      return new Response(
        JSON.stringify({ error: 'Benachrichtigung fehlgeschlagen', details: text }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  } catch (e) {
    console.error('telegram-notify error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
