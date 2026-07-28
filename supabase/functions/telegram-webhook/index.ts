import { createClient } from 'npm:@supabase/supabase-js@2';

const TELEGRAM_API = 'https://api.telegram.org';
const PORTAL = 'https://app.sekretariat-24.de';

function esc(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(d: string) {
  const date = new Date(`${d}T12:00:00Z`);
  const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getUTCDay()] ?? '';
  const [y, m, day] = d.split('-');
  return `${wd}, ${day}.${m}.${y}`;
}

async function deriveSecret(botToken: string) {
  const data = new TextEncoder().encode(`telegram-webhook:${botToken}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function safeEqual(a: string | null, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function send(botToken: string, chatId: number | string, text: string, withButton = false) {
  const r = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(withButton
        ? {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🗓 Im Portal öffnen',
                    url: `${PORTAL}/superadmin/bewerbungsgespraeche`,
                  },
                ],
              ],
            },
          }
        : {}),
    }),
  });
  if (!r.ok) console.error(`sendMessage failed [${r.status}]: ${await r.text()}`);
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━';
const NUMS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return new Response('Not configured', { status: 500 });

  const expected = await deriveSecret(botToken);
  if (!safeEqual(req.headers.get('X-Telegram-Bot-Api-Secret-Token'), expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let update: any;
  try {
    update = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ ok: true }));
  }

  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  const text: string = (message?.text ?? '').trim();
  if (!chatId || !text) return new Response(JSON.stringify({ ok: true }));

  const command = text.split(/[\s@]/)[0].toLowerCase();

  if (command === '/start' || command === '/hilfe' || command === '/help') {
    await send(
      botToken,
      chatId,
      [
        '👋 <b>Sekretariat24 Bot</b>',
        DIVIDER,
        `Deine Chat-ID: <code>${chatId}</code>`,
        '',
        'Trage diese ID im Portal unter <b>Telegram</b> ein, um Benachrichtigungen zu erhalten.',
        '',
        '<b>Befehle</b>',
        '• /kalender – kommende Bewerbungsgespräche',
      ].join('\n'),
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  if (command !== '/kalender') return new Response(JSON.stringify({ ok: true }));

  // Nur registrierte, aktive Empfänger dürfen Daten abrufen
  const { data: recipient } = await supabase
    .from('telegram_recipients')
    .select('id')
    .eq('chat_id', String(chatId))
    .eq('is_active', true)
    .maybeSingle();

  if (!recipient) {
    await send(
      botToken,
      chatId,
      `🔒 Dieser Chat ist nicht freigeschaltet.\n\nDeine Chat-ID: <code>${chatId}</code>`,
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  // Aktuelles Datum/Uhrzeit in Europe/Berlin
  const berlin = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  const [today, nowTime] = berlin.split(' ');

  const { data: rows, error } = await supabase
    .from('interview_appointments')
    .select('appointment_date, appointment_time, status, applications(vorname, nachname, handynummer)')
    .gte('appointment_date', today)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(30);

  if (error) {
    console.error('kalender query failed', error);
    await send(botToken, chatId, '⚠️ Termine konnten nicht geladen werden.');
    return new Response(JSON.stringify({ ok: true }));
  }

  const upcoming = (rows ?? [])
    .filter((row: any) => {
      const t = String(row.appointment_time ?? '').slice(0, 5);
      if (row.appointment_date === today && t < nowTime) return false;
      return true;
    })
    .slice(0, 10);

  if (upcoming.length === 0) {
    await send(
      botToken,
      chatId,
      '🗓 <b>Kommende Bewerbungsgespräche</b>\n\nKeine anstehenden Bewerbungsgespräche.',
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  const lines = ['🗓 <b>Kommende Bewerbungsgespräche</b>'];
  let lastDate = '';
  upcoming.forEach((row: any) => {
    const a = row.applications ?? {};
    const name = `${a.vorname ?? ''} ${a.nachname ?? ''}`.trim() || 'Unbekannt';
    if (row.appointment_date !== lastDate) {
      lastDate = row.appointment_date;
      lines.push('');
      lines.push(`<b>${esc(fmtDate(row.appointment_date))}</b>`);
    }
    lines.push(
      `  <code>${esc(String(row.appointment_time).slice(0, 5))}</code>  ${esc(name)}`,
    );
    lines.push(`         ${esc(a.handynummer ?? '—')}`);
  });

  await send(botToken, chatId, lines.join('\n'), true);
  return new Response(JSON.stringify({ ok: true }));
});
