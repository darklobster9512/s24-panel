import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

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
      .select('id, vorname, nachname, handynummer')
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

    return new Response(JSON.stringify({ ok: true }), {
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
