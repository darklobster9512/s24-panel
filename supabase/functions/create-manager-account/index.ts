import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  display_name: z.string().trim().max(120).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

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
    const { data: isSuper } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "superadmin",
    });
    if (!isSuper) return json({ error: "Forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { email, password, display_name } = parsed.data;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created?.user) {
      return json({ error: createErr?.message ?? "createUser failed" }, 400);
    }
    const newUserId = created.user.id;

    // Trigger hat 'kunde' gesetzt -> auf 'manager' korrigieren
    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "manager" });
    if (roleErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: roleErr.message }, 500);
    }

    const { error: insErr } = await admin.from("managers").insert({
      user_id: newUserId,
      email,
      display_name: display_name ?? null,
      created_by: callerId,
    });
    if (insErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: insErr.message }, 500);
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
