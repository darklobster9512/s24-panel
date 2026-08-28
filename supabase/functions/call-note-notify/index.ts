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

function fmtDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
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

  let body: { note_id?: string; kind?: string };
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Ungültiger Body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const noteId = body.note_id;
  const kind = body.kind === 'outbound' ? 'outbound' : 'inbound';
  if (!noteId || typeof noteId !== 'string') {
    return new Response(JSON.stringify({ error: 'note_id fehlt' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: note, error: nErr } = await supabase
    .from('call_notes')
    .select(
      'id, anrufer_name, anrufer_nummer, anliegen, kategorie, prioritaet, dauer_sekunden, ' +
        'client:clients(company_name), employee:employees(first_name, last_name), ' +
        'call:sipgate_calls(to_number, from_number)',
    )
    .eq('id', noteId)
    .maybeSingle();

  if (nErr || !note) {
    console.error('note lookup failed', nErr);
    return new Response(JSON.stringify({ error: 'Notiz nicht gefunden' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const client = note.client as { company_name: string | null } | null;
  const emp = note.employee as { first_name: string | null; last_name: string | null } | null;
  const call = note.call as { to_number: string | null; from_number: string | null } | null;

  const kunde = client?.company_name || 'Unbekannt';
  const mitarbeiter = `${emp?.first_name ?? ''} ${emp?.last_name ?? ''}`.trim() || 'Unbekannt';
  const person = note.anrufer_name || 'Unbekannt';
  const nummer = note.anrufer_nummer || '—';
  const dauer = fmtDuration(note.dauer_sekunden ?? 0);

  let text: string;
  if (kind === 'outbound') {
    const raw = String(note.anliegen ?? '');
    const failed = /^\[Fehlgeschlagen\]/i.test(raw);
    const cleaned = raw.replace(/^\[(Erfolgreich|Fehlgeschlagen)\]\s*/i, '');
    text = [
      '📤 <b>Neue Anruf-Notiz (Recruitment)</b>',
      DIVIDER,
      `🏢 Kunde: <b>${esc(kunde)}</b>`,
      `🎧 Mitarbeiter: <b>${esc(mitarbeiter)}</b>`,
      `👤 Bewerber: <b>${esc(person)}</b>`,
      `📱 <code>${esc(nummer)}</code>`,
      `📊 Ergebnis: ${failed ? '❌ Fehlgeschlagen' : '✅ Erfolgreich'}`,
      `⏱ Dauer: ${esc(dauer)}`,
      DIVIDER,
      '📝 <b>Notiz</b>',
      esc(cleaned),
    ].join('\n');
  } else {
    const details = [
      note.kategorie ? `Kategorie: ${note.kategorie}` : '',
      note.prioritaet ? `Priorität: ${note.prioritaet}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    text = [
      '📞 <b>Neue Anruf-Notiz (Inbound)</b>',
      DIVIDER,
      `🏢 Kunde: <b>${esc(kunde)}</b>`,
      `🎧 Mitarbeiter: <b>${esc(mitarbeiter)}</b>`,
      `👤 Anrufer: <b>${esc(person)}</b>`,
      `📱 <code>${esc(nummer)}</code>`,
      call?.to_number ? `☎️ Angerufen: <code>${esc(call.to_number)}</code>` : '',
      `⏱ Dauer: ${esc(dauer)}`,
      DIVIDER,
      details ? esc(details) : '',
      '📝 <b>Notiz</b>',
      esc(note.anliegen),
    ]
      .filter(Boolean)
      .join('\n');
  }

  const { data: rows, error: rErr } = await supabase
    .from('telegram_recipients')
    .select('chat_id')
    .eq('is_active', true)
    .eq('notify_notes', true);

  if (rErr) {
    console.error('recipients query failed', rErr);
    return new Response(JSON.stringify({ error: rErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: { chat_id: string; ok: boolean; status: number }[] = [];
  for (const row of rows ?? []) {
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
            [{ text: '📒 Notizen öffnen', url: `${PORTAL}/superadmin/notizen` }],
          ],
        },
      }),
    });
    const respBody = await r.text();
    if (!r.ok) console.error(`telegram sendMessage failed [${r.status}]: ${respBody}`);
    results.push({ chat_id: row.chat_id, ok: r.ok, status: r.status });
  }

  const failed = results.filter((r) => !r.ok).length;
  return new Response(JSON.stringify({ sent: results.length - failed, failed }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
