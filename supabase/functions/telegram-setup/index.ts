import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

async function deriveSecret(botToken: string) {
  const data = new TextEncoder().encode(`telegram-webhook:${botToken}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return json({ error: 'TELEGRAM_BOT_TOKEN fehlt' }, 500);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: claims } = await supabase.auth.getClaims(authHeader.slice(7));
  const uid = claims?.claims?.sub;
  if (!uid) return json({ error: 'Unauthorized' }, 401);
  const { data: isAdmin } = await supabase.rpc('has_role', {
    _user_id: uid,
    _role: 'superadmin',
  });
  if (!isAdmin) return json({ error: 'Forbidden' }, 403);

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-webhook`;
  const secret = await deriveSecret(botToken);

  const setRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ['message', 'edited_message'],
    }),
  });
  const setBody = await setRes.json();

  const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const infoBody = await infoRes.json();

  return json({ setWebhook: setBody, info: infoBody }, setRes.ok ? 200 : 502);
});
