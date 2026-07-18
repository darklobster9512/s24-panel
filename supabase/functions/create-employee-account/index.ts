import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  employee_id: z.string().uuid(),
  login_email: z.string().email().endsWith("@sekreteriat24.de"),
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
