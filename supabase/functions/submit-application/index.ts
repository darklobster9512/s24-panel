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
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

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
    .map(
      (b) =>
        `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.75;color:#1a2e1f;">${b}</p>`,
    )
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
  company: { name: string; address?: string | null; logoText?: string | null; accent?: string | null };
};
function renderApplicationEmailHtml(input: EmailInput) {
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
  const step = (n: number, title: string, body: string) => `<tr><td style="padding:0 0 14px 0;vertical-align:top;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" style="vertical-align:top;"><div style="width:26px;height:26px;border-radius:999px;background:${accent};color:#0f1a2e;font-size:13px;font-weight:700;text-align:center;line-height:26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${n}</div></td><td style="padding-left:12px;font-size:14px;line-height:1.6;color:#3b4a3f;"><div style="color:#1a2e1f;font-weight:600;margin-bottom:2px;">${title}</div><div>${body}</div></td></tr></table></td></tr>`;
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

<div style="padding:0 44px 40px 44px;"><div style="margin-top:12px;padding:22px 24px;border-radius:10px;background:${accentTint};border:1px solid ${accentBorder};">
<div style="font-size:13px;font-weight:700;color:${accentDark};margin:0 0 16px 0;letter-spacing:0.06em;text-transform:uppercase;">Der weitere Ablauf</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${step(1, 'Prüfung der Unterlagen', 'Unser Team sichtet deine Bewerbung sorgfältig.')}
${step(2, 'Persönliche Rückmeldung', 'Innerhalb weniger Werktage erhältst du eine Nachricht von uns.')}
${step(3, 'Kennenlerngespräch', 'Bei passender Qualifikation laden wir dich zu einem Gespräch ein.')}
</table></div></div></td></tr>
<tr><td style="padding:24px 8px 0 8px;">
<div style="height:1px;background:${accentBorder};margin:0 auto 16px auto;max-width:120px;line-height:1px;font-size:0;">&nbsp;</div>
<div style="font-size:12px;line-height:1.6;color:#6b7a70;text-align:center;">
<div style="font-weight:700;color:${accentDark};letter-spacing:0.02em;">${companyName}</div>
${address ? `<div>${address}</div>` : ''}
<div style="margin-top:10px;">Diese E-Mail wurde automatisch versendet. Bitte antworte nicht direkt auf diese Nachricht.</div>
</div></td></tr>
</table></td></tr></table></body></html>`;
}



const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ANSTELLUNG = ['vollzeit', 'teilzeit', 'minijob', 'werkstudent', 'freelance'] as const;

const BodySchema = z.object({
  vorname: z.string().trim().min(1).max(100),
  nachname: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  handynummer: z.string().trim().min(4).max(40),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD erwartet'),
  staatsangehoerigkeit: z.string().trim().min(1).max(100),
  anstellung: z.string().trim().min(1).max(50),
});

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-120);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const form = await req.formData();
    const raw = {
      vorname: String(form.get('vorname') ?? ''),
      nachname: String(form.get('nachname') ?? ''),
      email: String(form.get('email') ?? ''),
      handynummer: String(form.get('handynummer') ?? ''),
      geburtsdatum: String(form.get('geburtsdatum') ?? ''),
      staatsangehoerigkeit: String(form.get('staatsangehoerigkeit') ?? ''),
      anstellung: String(form.get('anstellung') ?? ''),
    };

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Eingabe', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const data = parsed.data;

    const file = form.get('lebenslauf');
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Lebenslauf-Datei fehlt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Lebenslauf darf maximal 10 MB groß sein' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Nur PDF, DOC oder DOCX erlaubt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const id = crypto.randomUUID();
    const cleanName = sanitize(file.name || 'lebenslauf');
    const storagePath = `${id}/${cleanName}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from('applications')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (upErr) {
      console.error('storage upload failed', upErr);
      return new Response(JSON.stringify({ error: 'Upload fehlgeschlagen' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insErr } = await supabase.from('applications').insert({
      id,
      vorname: data.vorname,
      nachname: data.nachname,
      email: data.email,
      handynummer: data.handynummer,
      geburtsdatum: data.geburtsdatum,
      staatsangehoerigkeit: data.staatsangehoerigkeit,
      anstellung: data.anstellung,
      lebenslauf_path: storagePath,
      lebenslauf_filename: cleanName,
      lebenslauf_mime: file.type,
    });
    if (insErr) {
      console.error('insert failed', insErr);
      await supabase.storage.from('applications').remove([storagePath]);
      return new Response(JSON.stringify({ error: 'Speichern fehlgeschlagen' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bestätigungsmail versenden (Fehler nur loggen)
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('resend_api_key, resend_from_name, resend_from_email, application_email_enabled, application_email_subject, application_email_body, company_name, company_address, accent_color, logo_text')
        .limit(1)
        .maybeSingle();

      if (
        settings?.application_email_enabled &&
        settings.resend_api_key &&
        settings.resend_from_email
      ) {
        const vars: Record<string, string> = {
          vorname: data.vorname,
          nachname: data.nachname,
          email: data.email,
        };

        const from = settings.resend_from_name
          ? `${settings.resend_from_name} <${settings.resend_from_email}>`
          : settings.resend_from_email;

        const subject = renderTemplate(
          settings.application_email_subject ?? 'Deine Bewerbung',
          vars,
        );
        const bodyText = settings.application_email_body ?? '';

        const html = renderApplicationEmailHtml({
          subject,
          bodyText,
          vars,
          company: {
            name: settings.company_name ?? 'Sekretariat24',
            address: settings.company_address,
            logoText: settings.logo_text ?? settings.company_name ?? 'Sekretariat24',
            accent: settings.accent_color ?? '#7bed9f',
          },
        });

        const text = renderTemplate(bodyText, vars);

        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.resend_api_key}`,
          },
          body: JSON.stringify({
            from,
            to: [data.email],
            subject,
            text,
            html,
          }),
        });
        if (!r.ok) {
          console.error('resend send failed', r.status, await r.text());
        }
      }
    } catch (mailErr) {
      console.error('confirmation mail error', mailErr);
    }

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('unexpected error', err);
    return new Response(JSON.stringify({ error: 'Serverfehler' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
