import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendSms, renderSmsTemplate, formatDateDeShort } from '../_shared/sms.ts';


// --- HTML mail renderer (mirror of src/lib/applicationEmail.ts) ---
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}
function textToParagraphs(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((b) =>
      b
        .split('\n')
        .map((line) => escapeHtml(line).replace(/[\t ]+/g, ' ').trim())
        .filter(Boolean)
        .join('<br style="line-height:1.75;" />'),
    )
    .filter(Boolean);
  return blocks
    .map((b) => `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.75;color:#1a2e1f;">${b}</p>`)
    .join('');
}
function splitLogo(logoText: string) {
  const m = logoText.match(/^(.*?)(\d+)$/);
  return m ? { head: m[1], tail: m[2] } : { head: logoText, tail: '' };
}

const CONFIRMATION_STEPS = [
  { title: 'Termin notieren', body: 'Tragen Sie sich den Termin am besten direkt in Ihren Kalender ein.' },
  { title: 'Kurzes Kennenlerngespräch', body: 'Wir sprechen ca. 20–30 Minuten über Ihre Erfahrung und offene Fragen.' },
  { title: 'Rückmeldung & nächste Schritte', body: 'Direkt im Anschluss klären wir gemeinsam, wie es weitergeht.' },
];

type ConfirmationInput = {
  subject: string;
  bodyText: string;
  vars: Record<string, string>;
  infoCard: { label: string; lines: string[] };
  company: { name: string; address?: string | null; logoText?: string | null; accent?: string | null };
};

function renderConfirmationEmailHtml(input: ConfirmationInput) {
  const accent = input.company.accent || '#7bed9f';
  const accentDark = '#2fa363';
  const accentTintSoft = '#f0fbf4';
  const accentTint = '#f4fbf6';
  const accentBorder = '#d9f2e2';
  const paragraphs = textToParagraphs(renderTemplate(input.bodyText, input.vars));
  const logoText = input.company.logoText || input.company.name || 'Sekretariat24';
  const { head, tail } = splitLogo(logoText);
  const companyName = escapeHtml(input.company.name || logoText);
  const address = input.company.address ? escapeHtml(input.company.address).replace(/\n/g, ' · ') : '';
  const preheader = escapeHtml(input.subject).slice(0, 140);

  const step = (n: number, title: string, body: string) => `
    <tr><td style="padding:0 0 14px 0;vertical-align:top;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="28" style="vertical-align:top;">
          <div style="width:26px;height:26px;border-radius:999px;background:${accent};color:#0f1a2e;font-size:13px;font-weight:700;text-align:center;line-height:26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${n}</div>
        </td>
        <td style="padding-left:12px;font-size:14px;line-height:1.6;color:#3b4a3f;">
          <div style="color:#1a2e1f;font-weight:600;margin-bottom:2px;">${escapeHtml(title)}</div>
          <div>${escapeHtml(body)}</div>
        </td>
      </tr></table>
    </td></tr>`;

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>${escapeHtml(input.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f5;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="background:#ffffff;border-radius:14px;box-shadow:0 1px 2px rgba(16,24,20,0.04),0 8px 24px rgba(16,24,20,0.06);overflow:hidden;border:1px solid #eaeee9;">
<div style="padding:32px 32px;background:#130f40;text-align:center;"><div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;">${escapeHtml(head)}<span style="color:${accent};">${escapeHtml(tail)}</span></div></div>
<div style="height:3px;background:${accent};line-height:3px;font-size:0;">&nbsp;</div>
<div style="padding:40px 44px 8px 44px;"><div style="margin:0 0 24px 0;">${paragraphs}</div></div>

<div style="padding:0 44px 32px 44px;">
  <div style="border-left:4px solid ${accent};background:${accentTintSoft};border-radius:10px;padding:18px 22px;">
    <div style="font-size:12px;font-weight:700;color:${accentDark};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">${escapeHtml(input.infoCard.label)}</div>
    ${input.infoCard.lines
      .map((l) => `<div style="font-size:16px;font-weight:600;color:#1a2e1f;line-height:1.6;">${escapeHtml(l)}</div>`)
      .join('')}
  </div>
</div>

<div style="padding:0 44px 40px 44px;"><div style="padding:22px 24px;border-radius:10px;background:${accentTint};border:1px solid ${accentBorder};">
<div style="font-size:13px;font-weight:700;color:${accentDark};margin:0 0 16px 0;letter-spacing:0.06em;text-transform:uppercase;">Der weitere Ablauf</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${CONFIRMATION_STEPS.map((s, i) => step(i + 1, s.title, s.body)).join('')}
</table>
</div></div></td></tr>
<tr><td style="padding:24px 8px 0 8px;">
<div style="height:1px;background:${accentBorder};margin:0 auto 16px auto;max-width:120px;line-height:1px;font-size:0;">&nbsp;</div>
<div style="font-size:12px;line-height:1.6;color:#6b7a70;text-align:center;">
<div style="font-weight:700;color:${accentDark};letter-spacing:0.02em;">${companyName}</div>
${address ? `<div>${address}</div>` : ''}
<div style="margin-top:10px;">Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese Nachricht.</div>
</div></td></tr>
</table></td></tr></table></body></html>`;
}

const WEEKDAYS_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function formatDateDe(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: WEEKDAYS_DE[dt.getUTCDay()],
    date: `${d}. ${MONTHS_DE[m - 1]} ${y}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { token } = await req.json();
    if (typeof token !== 'string' || token.length < 10) {
      return new Response(JSON.stringify({ error: 'Ungültiger Token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: app } = await supabase
      .from('applications')
      .select('id, vorname, nachname, email, handynummer')
      .eq('booking_token', token)
      .maybeSingle();

    if (!app) {
      return new Response(JSON.stringify({ error: 'Unbekannter Token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: appt } = await supabase
      .from('interview_appointments')
      .select('appointment_date, appointment_time')
      .eq('application_id', app.id)
      .maybeSingle();

    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-notify-secret': Deno.env.get('TELEGRAM_NOTIFY_SECRET') ?? '',
      },
      body: JSON.stringify({
        type: 'interview',
        payload: {
          vorname: app.vorname,
          nachname: app.nachname,
          handynummer: app.handynummer,
          appointment_date: appt?.appointment_date,
          appointment_time: appt?.appointment_time,
        },
      }),
    });
    if (!res.ok) console.error(`telegram-notify failed [${res.status}]: ${await res.text()}`);

    // --- Bestätigungs-Mail an den Bewerber (darf die Buchung nie blockieren) ---
    let emailSent = false;
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select(
          'resend_api_key, resend_from_name, resend_from_email, confirmation_email_enabled, confirmation_email_subject, confirmation_email_body, company_name, company_address, accent_color, logo_text',
        )
        .limit(1)
        .maybeSingle();

      if (!settings?.confirmation_email_enabled) {
        console.log('confirmation email disabled – skipped');
      } else if (!settings.resend_api_key || !settings.resend_from_email) {
        console.log('resend not configured – confirmation email skipped');
      } else if (!appt?.appointment_date || !app.email) {
        console.log('no appointment or email – confirmation email skipped');
      } else {
        const { weekday, date } = formatDateDe(appt.appointment_date as string);
        const time = String(appt.appointment_time ?? '').slice(0, 5);
        const vollerName = `${app.vorname} ${app.nachname}`.trim();

        const vars: Record<string, string> = {
          vorname: app.vorname,
          nachname: app.nachname,
          voller_name: vollerName,
          email: app.email,
          datum: date,
          uhrzeit: time,
          wochentag: weekday,
        };

        const subject = renderTemplate(
          settings.confirmation_email_subject ?? 'Ihr Termin ist bestätigt',
          vars,
        );
        const bodyText = settings.confirmation_email_body ?? '';
        const html = renderConfirmationEmailHtml({
          subject,
          bodyText,
          vars,
          infoCard: {
            label: 'Ihr Termin',
            lines: [`${weekday}, ${date}`, `${time} Uhr`],
          },
          company: {
            name: settings.company_name ?? 'Sekretariat24',
            address: settings.company_address,
            logoText: settings.logo_text ?? settings.company_name ?? 'Sekretariat24',
            accent: settings.accent_color ?? '#7bed9f',
          },
        });
        const text = `${renderTemplate(bodyText, vars)}\n\nTermin: ${weekday}, ${date} um ${time} Uhr`;

        const from = settings.resend_from_name
          ? `${settings.resend_from_name} <${settings.resend_from_email}>`
          : settings.resend_from_email;

        const mailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.resend_api_key}`,
          },
          body: JSON.stringify({ from, to: [app.email], subject, text, html }),
        });
        if (!mailRes.ok) {
          console.error(`resend confirmation failed [${mailRes.status}]: ${await mailRes.text()}`);
        } else {
          emailSent = true;
        }
      }
    } catch (mailErr) {
      console.error('confirmation email error', mailErr);
    }

    // --- Bestätigungs-SMS (darf die Buchung nie blockieren) ---
    let sms: { ok: boolean; skipped?: string; error?: string } = { ok: false, skipped: 'no_appointment' };
    try {
      if (appt?.appointment_date) {
        const { data: smsSettings } = await supabase
          .from('app_settings')
          .select('sms_enabled, seven_api_key, sms_sender_name, sms_confirmation_text, company_name')
          .limit(1)
          .maybeSingle();

        const tpl = smsSettings?.sms_confirmation_text ??
          'Hallo {vorname}, dein Bewerbungsgespräch bei {unternehmen} ist bestätigt: {datum} um {uhrzeit} Uhr. Bis dann!';
        const message = renderSmsTemplate(tpl, {
          vorname: app.vorname ?? '',
          nachname: app.nachname ?? '',
          unternehmen: smsSettings?.company_name ?? 'Sekretariat24',
          datum: formatDateDeShort(String(appt.appointment_date)),
          uhrzeit: String(appt.appointment_time ?? '').slice(0, 5),
        });

        sms = await sendSms({
          admin: supabase,
          apiKey: smsSettings?.seven_api_key,
          senderName: smsSettings?.sms_sender_name,
          enabled: smsSettings?.sms_enabled,
          rawPhone: app.handynummer as string | null,
          message,
          applicationId: app.id,
        });
      }
    } catch (smsErr) {
      console.error('confirmation sms error', smsErr);
      sms = { ok: false, error: String(smsErr) };
    }

    return new Response(JSON.stringify({ ok: true, email_sent: emailSent, sms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('interview-booked-notify error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
