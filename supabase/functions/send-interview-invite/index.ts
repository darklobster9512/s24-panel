import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

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

type EmailInput = {
  subject: string;
  bodyText: string;
  vars: Record<string, string>;
  bookingUrl: string;
  company: { name: string; address?: string | null; logoText?: string | null; accent?: string | null };
};

const INTERVIEW_STEPS = [
  { title: "Termin wählen", body: "Such dir über den Button oben einen passenden Zeitraum aus." },
  { title: "Kurzes Kennenlerngespräch", body: "Wir sprechen ca. 20–30 Minuten online über deine Erfahrung und offene Fragen." },
  { title: "Rückmeldung & nächste Schritte", body: "Direkt im Anschluss klären wir gemeinsam, wie es weitergeht." },
];

function renderInterviewEmailHtml(input: EmailInput) {
  const accent = input.company.accent || '#7bed9f';
  const accentDark = '#2fa363';
  const accentTint = '#f4fbf6';
  const accentBorder = '#d9f2e2';
  const paragraphs = textToParagraphs(renderTemplate(input.bodyText, input.vars));
  const logoText = input.company.logoText || input.company.name || 'Sekretariat24';
  const { head, tail } = splitLogo(logoText);
  const companyName = escapeHtml(input.company.name || logoText);
  const address = input.company.address ? escapeHtml(input.company.address).replace(/\n/g, ' · ') : '';
  const preheader = escapeHtml(input.subject).slice(0, 140);
  const bookingUrl = escapeHtml(input.bookingUrl);

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

<div style="padding:0 44px 32px 44px;text-align:center;">
  <a href="${bookingUrl}" style="display:inline-block;background:${accent};color:#0f1a2e;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;letter-spacing:0.02em;">Termin auswählen</a>
</div>

<div style="padding:0 44px 40px 44px;"><div style="padding:22px 24px;border-radius:10px;background:${accentTint};border:1px solid ${accentBorder};">
<div style="font-size:13px;font-weight:700;color:${accentDark};margin:0 0 16px 0;letter-spacing:0.06em;text-transform:uppercase;">Der weitere Ablauf</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${INTERVIEW_STEPS.map((s, i) => step(i + 1, s.title, s.body)).join('')}
</table>
</div></div></td></tr>
<tr><td style="padding:24px 8px 0 8px;">
<div style="height:1px;background:${accentBorder};margin:0 auto 16px auto;max-width:120px;line-height:1px;font-size:0;">&nbsp;</div>
<div style="font-size:12px;line-height:1.6;color:#6b7a70;text-align:center;">
<div style="font-weight:700;color:${accentDark};letter-spacing:0.02em;">${companyName}</div>
${address ? `<div>${address}</div>` : ''}
<div style="margin-top:10px;">Diese E-Mail wurde automatisch versendet. Bitte antworte nicht direkt auf diese Nachricht.</div>
</div></td></tr>
</table></td></tr></table></body></html>`;
}


const BodySchema = z.object({
  application_id: z.string().uuid(),
  site_url: z.string().url().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify caller is authenticated superadmin
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(supabaseUrl, service);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .eq('role', 'superadmin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'invalid_input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { application_id, site_url } = parsed.data;

    // Load application & ensure booking_token
    const { data: app, error: appErr } = await admin
      .from('applications')
      .select('id, vorname, nachname, email, booking_token, status')
      .eq('id', application_id)
      .maybeSingle();
    if (appErr || !app) {
      return new Response(JSON.stringify({ error: 'application_not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let token = app.booking_token as string | null;
    if (!token) {
      token = crypto.randomUUID();
      const { error: updErr } = await admin
        .from('applications')
        .update({ booking_token: token, status: 'bewerbungsgespraech' })
        .eq('id', app.id);
      if (updErr) throw updErr;
    } else {
      await admin
        .from('applications')
        .update({ status: 'bewerbungsgespraech' })
        .eq('id', app.id);
    }

    // Load settings
    const { data: settings } = await admin
      .from('app_settings')
      .select('resend_api_key, resend_from_name, resend_from_email, interview_email_enabled, interview_email_subject, interview_email_body, company_name, company_address, accent_color, logo_text')
      .limit(1)
      .maybeSingle();

    if (!settings?.interview_email_enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: 'disabled', token }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!settings.resend_api_key || !settings.resend_from_email) {
      return new Response(JSON.stringify({ error: 'resend_not_configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = site_url || req.headers.get('origin') || '';
    const baseUrl = origin.replace(/\/+$/, '');
    const bookingUrl = `${baseUrl}/bewerbungsgespraech/${token}`;

    const vars: Record<string, string> = {
      vorname: app.vorname,
      nachname: app.nachname,
      email: app.email,
      booking_url: bookingUrl,
    };

    const from = settings.resend_from_name
      ? `${settings.resend_from_name} <${settings.resend_from_email}>`
      : settings.resend_from_email;

    const subject = renderTemplate(
      settings.interview_email_subject ?? 'Buche dein Bewerbungsgespräch',
      vars,
    );
    const bodyText = settings.interview_email_body ?? '';
    const html = renderInterviewEmailHtml({
      subject,
      bodyText,
      vars,
      bookingUrl,
      company: {
        name: settings.company_name ?? 'Sekretariat24',
        address: settings.company_address,
        logoText: settings.logo_text ?? settings.company_name ?? 'Sekretariat24',
        accent: settings.accent_color ?? '#7bed9f',
      },
    });
    const text = `${renderTemplate(bodyText, vars)}\n\n${bookingUrl}`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.resend_api_key}`,
      },
      body: JSON.stringify({ from, to: [app.email], subject, text, html }),
    });
    if (!r.ok) {
      const errText = await r.text();
      console.error('resend send failed', r.status, errText);
      return new Response(JSON.stringify({ error: 'resend_failed', status: r.status, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, token, booking_url: bookingUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('unexpected error', err);
    return new Response(JSON.stringify({ error: 'server_error', message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
