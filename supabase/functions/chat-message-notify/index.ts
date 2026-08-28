import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TELEGRAM_API = 'https://api.telegram.org';
const PORTAL = 'https://sekretariat24.app';
const DIVIDER = '━━━━━━━━━━━━━━━━━━';

function esc(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN ist nicht konfiguriert' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.slice(7));
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { message_id?: string };
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Ungültiger Body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const messageId = body.message_id;
  if (!messageId || typeof messageId !== 'string') {
    return new Response(JSON.stringify({ error: 'message_id fehlt' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: msg, error: mErr } = await supabase
    .from('chat_messages')
    .select(
      'id, content, sender_role, deleted_at, ' +
        'conversation:chat_conversations(employee:employees(first_name, last_name))',
    )
    .eq('id', messageId)
    .maybeSingle();

  if (mErr || !msg) {
    console.error('message lookup failed', mErr);
    return new Response(JSON.stringify({ error: 'Nachricht nicht gefunden' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (msg.sender_role !== 'mitarbeiter' || msg.deleted_at) {
    return new Response(JSON.stringify({ skipped: true, sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const conv = msg.conversation as {
    employee: { first_name: string | null; last_name: string | null } | null;
  } | null;
  const emp = conv?.employee ?? null;
  const mitarbeiter = `${emp?.first_name ?? ''} ${emp?.last_name ?? ''}`.trim() || 'Unbekannt';

  const text = [
    '💬 <b>Neue Livechat-Nachricht</b>',
    DIVIDER,
    `🎧 Mitarbeiter: <b>${esc(mitarbeiter)}</b>`,
    `📝 ${esc(msg.content)}`,
  ].join('\n');

  const { data: rows, error: rErr } = await supabase
    .from('telegram_recipients')
    .select('chat_id')
    .eq('is_active', true)
    .eq('notify_chat', true);

  if (rErr) {
    console.error('recipients query failed', rErr);
    return new Response(JSON.stringify({ error: rErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!rows || rows.length === 0) {
    console.warn('chat-message-notify: no active recipients with notify_chat enabled');
    return new Response(JSON.stringify({ sent: 0, failed: 0, recipients: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: { chat_id: string; ok: boolean; status: number }[] = [];
  for (const row of rows) {
    const r = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: row.chat_id,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Livechat öffnen', url: `${PORTAL}/superadmin/livechat` }],
          ],
        },
      }),
    });
    const respBody = await r.text();
    if (!r.ok) console.error(`telegram sendMessage failed [${r.status}]: ${respBody}`);
    results.push({ chat_id: row.chat_id, ok: r.ok, status: r.status });
  }

  const failed = results.filter((x) => !x.ok).length;
  return new Response(
    JSON.stringify({ sent: results.length - failed, failed, recipients: rows.length }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
