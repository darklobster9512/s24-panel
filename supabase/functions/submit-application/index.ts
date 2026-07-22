import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
      return new Response(JSON.stringify({ error: 'Datei zu groß (max. 5 MB) oder leer' }), {
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
            name: settings.company_name ?? 'Sekreteriat24',
            address: settings.company_address,
            logoText: settings.logo_text ?? settings.company_name ?? 'Sekreteriat24',
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
