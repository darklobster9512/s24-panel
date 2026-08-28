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

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  if (!y) return d;
  const date = new Date(`${d}T12:00:00Z`);
  const wd = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][
    date.getUTCDay()
  ] ?? '';
  return `${wd}, ${day}.${m}.${y}`;
}

/** Aktuelles Datum/Uhrzeit in Europe/Berlin als { date: 'YYYY-MM-DD', minutes: number } */
function berlinNow() {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  const [date, time] = parts.split(' ');
  const [h, m] = time.split(':').map(Number);
  return { date, minutes: h * 60 + m };
}

async function send(token: string, chatId: string, text: string) {
  const r = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { text: '🗓 Termin öffnen', url: `${PORTAL}/superadmin/bewerbungsgespraeche` },
        ]],
      },
    }),
  });
  if (!r.ok) {
    console.error('telegram send failed', r.status, await r.text());
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!botToken || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'missing_configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { date, minutes } = berlinNow();

  // Termine des heutigen Tages, die noch keine Erinnerung erhalten haben
  const { data: rows, error } = await supabase
    .from('interview_appointments')
    .select('id, appointment_date, appointment_time, status, applications(vorname, nachname, handynummer)')
    .eq('appointment_date', date)
    .is('reminder_sent_at', null)
    .limit(100);

  if (error) {
    console.error('reminder query failed', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const CANCELLED = ['abgesagt', 'storniert', 'abgelehnt'];

  // Termine, deren Start 4–5 Minuten in der Zukunft liegt
  const due = (rows ?? []).filter((row: any) => {
    if (CANCELLED.includes(String(row.status ?? '').toLowerCase())) return false;
    const [h, m] = String(row.appointment_time ?? '00:00').split(':').map(Number);
    const diff = h * 60 + m - minutes;
    return diff > 3 && diff <= 5;
  });

  if (due.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: recipients } = await supabase
    .from('telegram_recipients')
    .select('chat_id')
    .eq('is_active', true)
    .eq('notify_interviews', true);

  const chatIds = (recipients ?? []).map((r: any) => String(r.chat_id));
  let sent = 0;

  for (const row of due) {
    const a = (row as any).applications ?? {};
    const name = `${a.vorname ?? ''} ${a.nachname ?? ''}`.trim() || 'Unbekannt';
    const time = String((row as any).appointment_time ?? '').slice(0, 5);
    const text = [
      '🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔',
      '🔔 <b>TERMIN-ERINNERUNG</b>',
      '🔔 Bewerbungsgespräch in 5 Minuten',
      '🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔',
      '',
      `👤 <b>${esc(name)}</b>`,
      `🗓 ${esc(fmtDate((row as any).appointment_date))} · ${esc(time)} Uhr`,
      `📱 <code>${esc(a.handynummer ?? '—')}</code>`,
      '',
      '🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔',
    ].join('\n');

    for (const chatId of chatIds) {
      await send(botToken, chatId, text);
      sent++;
    }

    await supabase
      .from('interview_appointments')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', (row as any).id);
  }

  return new Response(JSON.stringify({ ok: true, appointments: due.length, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
