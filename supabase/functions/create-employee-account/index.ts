import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { renderApplicationEmailHtml, renderTemplate } from "./email.ts";

const PORTAL_URL = "https://app.sekretariat-24.de";

const WELCOME_STEPS = [
  { title: "Einloggen", body: "Melde dich mit den Zugangsdaten oben im Mitarbeiter-Portal an." },
  { title: "Arbeitsvertrag ausfüllen", body: "Ergänze im Portal deine persönlichen Daten für den Arbeitsvertrag." },
  { title: "Digital unterschreiben", body: "Prüfe den Vertrag und unterschreibe ihn direkt online." },
];

async function sendWelcomeEmail(
  admin: ReturnType<typeof createClient>,
  employee_id: string,
  login_email: string,
  password: string,
) {
  const { data: settings } = await admin
    .from("app_settings")
    .select(
      "resend_api_key, resend_from_name, resend_from_email, welcome_email_enabled, welcome_email_subject, welcome_email_body, company_name, company_address, accent_color, logo_text",
    )
    .limit(1)
    .maybeSingle();

  if (!settings?.welcome_email_enabled) {
    console.log("welcome email disabled – skipped");
    return false;
  }
  if (!settings.resend_api_key || !settings.resend_from_email) {
    console.log("resend not configured – welcome email skipped");
    return false;
  }

  const { data: emp } = await admin
    .from("employees")
    .select("first_name, last_name, personal_email")
    .eq("id", employee_id)
    .maybeSingle();

  const to = emp?.personal_email;
  if (!to) {
    console.log("no personal email – welcome email skipped");
    return false;
  }

  const vars: Record<string, string> = {
    vorname: emp?.first_name ?? "",
    nachname: emp?.last_name ?? "",
    voller_name: `${emp?.first_name ?? ""} ${emp?.last_name ?? ""}`.trim(),
    login_email,
    passwort: password,
    portal_url: PORTAL_URL,
  };

  const subject = renderTemplate(
    settings.welcome_email_subject ?? "Deine Zugangsdaten für dein Mitarbeiterkonto",
    vars,
  );
  const bodyText = settings.welcome_email_body ?? "";
  const html = renderApplicationEmailHtml({
    subject,
    bodyText,
    vars,
    company: {
      name: settings.company_name ?? "Sekretariat24",
      address: settings.company_address,
      logoText: settings.logo_text ?? settings.company_name ?? "Sekretariat24",
      accent: settings.accent_color ?? "#7bed9f",
    },
    infoCard: {
      label: "Deine Zugangsdaten",
      lines: [`E-Mail: ${login_email}`, `Passwort: ${password}`],
    },
    cta: { label: "Jetzt einloggen", url: PORTAL_URL },
    steps: WELCOME_STEPS,
  });
  const text = `${renderTemplate(bodyText, vars)}\n\nLogin-E-Mail: ${login_email}\nPasswort: ${password}\nPortal: ${PORTAL_URL}`;

  const from = settings.resend_from_name
    ? `${settings.resend_from_name} <${settings.resend_from_email}>`
    : settings.resend_from_email;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.resend_api_key}`,
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    console.error(`resend welcome failed [${res.status}]: ${await res.text()}`);
    return false;
  }
  return true;
}

const BodySchema = z.object({
  employee_id: z.string().uuid(),
  login_email: z.string().email().endsWith("@sekretariat-24.de"),
  password: z.string().min(6).max(128),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: isSuper, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "superadmin",
    });
    if (roleErr) return json({ error: roleErr.message }, 500);
    if (!isSuper) return json({ error: "Forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { employee_id, login_email, password } = parsed.data;

    // Create auth user with role in metadata so handle_new_user trigger assigns 'mitarbeiter'
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: login_email,
      password,
      email_confirm: true,
      user_metadata: { role: "mitarbeiter" },
    });
    if (createErr || !created?.user) {
      return json({ error: createErr?.message ?? "createUser failed" }, 400);
    }
    const newUserId = created.user.id;


    // Link + activate employee
    const { error: updErr } = await admin
      .from("employees")
      .update({ user_id: newUserId, is_draft: false })
      .eq("id", employee_id);
    if (updErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: updErr.message }, 500);
    }

    return json({ user_id: newUserId }, 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
