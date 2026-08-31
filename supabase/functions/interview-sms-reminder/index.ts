import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendSms, renderSmsTemplate, formatDateDeShort } from '../_shared/sms.ts';

const CANCELLED = ['abgesagt', 'storniert', 'abgelehnt'];

const berlinFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Berlin',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

function berlinOffsetMs(utcDate: Date) {
  const parts = berlinFmt.formatToParts(utcDate);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - utcDate.getTime();
}

/** Interpret 'YYYY-MM-DD' + 'HH:MM:SS' as Europe/Berlin wall time, return the UTC instant. */
function berlinToUtc(dateStr: string, timeStr: string): Date {
  const naive = new Date(`${dateStr}T${(timeStr || '00:00:00').substring(0, 8)}Z`);
  let result = new Date(naive.getTime() - berlinOffsetMs(naive));
  result = new Date(naive.getTime() - berlinOffsetMs(result));
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'missing_configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const now = new Date();

  const { data: settings } = await admin
    .from('app_settings')
    .select('sms_enabled, seven_api_key, sms_sender_name, sms_reminder_text, company_name')
    .limit(1)
    .maybeSingle();

  if (!settings?.sms_enabled || !settings.seven_api_key) {
    return new Response(JSON.stringify({ ok: true, skipped: 'sms_disabled' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const dayStr = (d: Date) => d.toISOString().split('T')[0];
  const from = dayStr(new Date(now.getTime() - 24 * 3600 * 1000));
  const to = dayStr(new Date(now.getTime() + 24 * 3600 * 1000));

  const { data: rows, error } = await admin
    .from('interview_appointments')
    .select('id, appointment_date, appointment_time, status, applications(id, vorname, nachname, handynummer)')
    .is('sms_reminder_sent_at', null)
    .gte('appointment_date', from)
    .lte('appointment_date', to)
    .limit(200);

  if (error) {
    console.error('reminder query failed', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const lower = now.getTime() + 55 * 60 * 1000;
  const upper = now.getTime() + 65 * 60 * 1000;

  const due = (rows ?? []).filter((r: any) => {
    if (CANCELLED.includes(String(r.status ?? '').toLowerCase())) return false;
    const t = berlinToUtc(r.appointment_date, String(r.appointment_time ?? '')).getTime();
    return t >= lower && t < upper;
  });

  const tpl = settings.sms_reminder_text ??
    'Hallo {vorname}, Erinnerung: dein Bewerbungsgespräch bei {unternehmen} startet um {uhrzeit} Uhr.';

  let sent = 0;
  for (const row of due as any[]) {
    const a = row.applications ?? {};
    const uhrzeit = String(row.appointment_time ?? '').slice(0, 5);
    const message = renderSmsTemplate(tpl, {
      vorname: a.vorname ?? '',
      nachname: a.nachname ?? '',
      unternehmen: settings.company_name ?? 'Sekretariat24',
      datum: formatDateDeShort(String(row.appointment_date)),
      uhrzeit,
    });

    const res = await sendSms({
      admin,
      apiKey: settings.seven_api_key,
      senderName: settings.sms_sender_name,
      enabled: true,
      rawPhone: a.handynummer,
      message,
      applicationId: a.id ?? null,
    });

    await admin
      .from('interview_appointments')
      .update({ sms_reminder_sent_at: new Date().toISOString() })
      .eq('id', row.id);

    if (res.ok) sent++;
    else console.error('reminder sms failed', row.id, res.error ?? res.skipped);
  }

  return new Response(JSON.stringify({ ok: true, due: due.length, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
