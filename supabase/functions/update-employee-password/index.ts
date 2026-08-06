import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  employee_id: z.string().uuid(),
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
    const callerEmail = (claims.claims.email as string | undefined) ?? null;

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
    const { employee_id, password } = parsed.data;

    const { data: emp, error: empErr } = await admin
      .from("employees")
      .select("id, user_id, login_email")
      .eq("id", employee_id)
      .maybeSingle();
    if (empErr) return json({ error: empErr.message }, 500);
    if (!emp?.user_id) return json({ error: "Kein Login-Account vorhanden" }, 400);

    const { error: updUserErr } = await admin.auth.admin.updateUserById(
      emp.user_id as string,
      { password },
    );
    if (updUserErr) return json({ error: updUserErr.message }, 400);

    const { error: updErr } = await admin
      .from("employees")
      .update({ password_plain: password })
      .eq("id", employee_id);
    if (updErr) return json({ error: updErr.message }, 500);

    try {
      await admin.from("activity_log").insert({
        actor_user_id: callerId,
        actor_email: callerEmail,
        action: "employee_password_updated",
        entity_type: "employee",
        entity_id: employee_id,
        details: { login_email: emp.login_email ?? null },
      });
    } catch (logErr) {
      console.error("activity log failed", logErr);
    }

    return json({ ok: true }, 200);
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
