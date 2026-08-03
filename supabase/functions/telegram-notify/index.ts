import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TELEGRAM_API = 'https://api.telegram.org';
const PORTAL = 'https://app.sekretariat-24.de';

function esc(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  if (!y) return d;
  const date = new Date(`${d}T12:00:00Z`);
  const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getUTCDay()] ?? '';
  return `${wd}, ${day}.${m}.${y}`;
}

function fmtTime(t?: string | null) {
  if (!t) return '—';
  return `${t.slice(0, 5)} Uhr`;
}

function fmtDateTimeNow() {
  return new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━';

function buildMessage(type: string, p: Record<string, unknown>) {
  const name = `${p.vorname ?? ''} ${p.nachname ?? ''}`.trim() || 'Unbekannt';

  if (type === 'application') {
    return {
      text: [
        '🆕 <b>Neue Bewerbung</b>',
        DIVIDER,
        `👤 <b>${esc(name)}</b>`,
        `✉️ ${esc(p.email)}`,
        `📱 <code>${esc(p.handynummer)}</code>`,
        `🎂 ${esc(fmtDate(p.geburtsdatum as string))} · 🌍 ${esc(p.staatsangehoerigkeit)}`,
        `💼 ${esc(p.anstellung)}`,
        DIVIDER,
        `🕓 <i>${esc(fmtDateTimeNow())}</i>`,
      ].join('\n'),
      url: `${PORTAL}/superadmin/bewerbungen`,
      buttonText: '📂 Bewerbung öffnen',
    };
  }

  if (type === 'interview') {
    return {
      text: [
        '📅 <b>Bewerbungsgespräch gebucht</b>',
        DIVIDER,
        `👤 <b>${esc(name)}</b>`,
        `🗓 ${esc(fmtDate(p.appointment_date as string))} um ${esc(fmtTime(p.appointment_time as string))}`,
        `📱 <code>${esc(p.handynummer)}</code>`,
        DIVIDER,
        `🕓 <i>gebucht am ${esc(fmtDateTimeNow())}</i>`,
      ].join('\n'),
      url: `${PORTAL}/superadmin/bewerbungsgespraeche`,
      buttonText: '🗓 Termin öffnen',
    };
  }
  if (type === 'contract') {
    const details = [p.template_title, p.contract_type].filter(Boolean).map(esc).join(' · ');
    return {
      text: [
        '📝 <b>Arbeitsvertrag eingereicht</b>',
        DIVIDER,
        `👤 <b>${esc(name)}</b>`,
        details ? `📄 ${details}` : '',
        p.salary ? `💶 ${esc(p.salary)} € / Monat` : '',
        'Der Vertrag wartet auf deine Bestätigung.',
        DIVIDER,
        `🕓 <i>${esc(fmtDateTimeNow())}</i>`,
      ]
        .filter(Boolean)
        .join('\n'),
      url: `${PORTAL}/superadmin/arbeitsvertraege/${esc(p.contract_id)}`,
      buttonText: '📄 Vertrag prüfen',
    };
  }


  return {
    text: [
      '✅ <b>Testnachricht</b>',
      DIVIDER,
      'Die Telegram-Anbindung von <b>Sekretariat24</b> funktioniert.',
      '',
      'Verfügbare Befehle:',
      '• /kalender – kommende Bewerbungsgespräche',
      DIVIDER,
      `🕓 <i>${esc(fmtDateTimeNow())}</i>`,
    ].join('\n'),
    url: `${PORTAL}/superadmin/telegram`,
    buttonText: '⚙️ Einstellungen',
  };
}

async function sendTelegram(token: string, chatId: string, msg: ReturnType<typeof buildMessage>) {
  const r = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: msg.text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: msg.buttonText, url: msg.url }]],
      },
    }),
  });
  const body = await r.text();
  if (!r.ok) console.error(`telegram sendMessage failed [${r.status}]: ${body}`);
  else {
    try {
      const json = JSON.parse(body);
      if (json?.ok === false) console.error('telegram error:', body);
    } catch (_) {
      // ignore
    }
  }
  return { ok: r.ok, status: r.status, body };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN ist nicht konfiguriert' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let payload: { type?: string; payload?: Record<string, unknown>; chat_id?: string };
  try {
    payload = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Ungültiger Body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const type = payload.type ?? '';
  if (!['application', 'interview', 'contract', 'test'].includes(type)) {
    return new Response(JSON.stringify({ error: 'Unbekannter Typ' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth: interner Shared Secret Header ODER Superadmin-JWT (nur für Tests)
  const internalSecret = Deno.env.get('TELEGRAM_NOTIFY_SECRET') ?? '';
  const providedSecret = req.headers.get('x-notify-secret') ?? '';
  let authorized = internalSecret.length > 0 && providedSecret === internalSecret;

  if (!authorized) {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.slice(7);
      const { data } = await supabase.auth.getClaims(jwt);
      const uid = data?.claims?.sub;
      if (uid) {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: uid,
          _role: 'superadmin',
        });
        authorized = Boolean(isAdmin);
      }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const column = type === 'application' ? 'notify_applications' : 'notify_interviews';
  let chatIds: string[] = [];

  if (payload.chat_id) {
    chatIds = [String(payload.chat_id)];
  } else {
    let query = supabase.from('telegram_recipients').select('chat_id').eq('is_active', true);
    if (type !== 'test') query = query.eq(column, true);
    const { data: rows, error } = await query;
    if (error) {
      console.error('recipients query failed', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    chatIds = (rows ?? []).map((r: { chat_id: string }) => r.chat_id);
  }

  const msg = buildMessage(type, payload.payload ?? {});
  const results = [];
  for (const chatId of chatIds) {
    results.push({ chat_id: chatId, ...(await sendTelegram(token, chatId, msg)) });
  }

  const failed = results.filter((r) => !r.ok);
  return new Response(
    JSON.stringify({ sent: results.length - failed.length, failed: failed.length, results }),
    {
      status: failed.length && failed.length === results.length && results.length > 0 ? 502 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
