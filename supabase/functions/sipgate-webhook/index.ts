// sipgate.io webhook receiver.
// Public endpoint (no JWT), authenticated by a shared token in the URL.
// sipgate posts application/x-www-form-urlencoded with events:
//   newCall  -> ringing
//   answer   -> answered
//   hangup   -> ended/missed
//
// URL example:
//   POST https://<project>.supabase.co/functions/v1/sipgate-webhook?token=<TOKEN>

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIPGATE_WEBHOOK_TOKEN = Deno.env.get("SIPGATE_WEBHOOK_TOKEN")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function normalizeNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/[^\d+]/g, "");
  if (!trimmed) return null;
  // sipgate typically sends E.164 already; ensure leading +
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("00")) return "+" + trimmed.slice(2);
  if (trimmed.startsWith("0")) return "+49" + trimmed.slice(1); // best-effort DE default
  return "+" + trimmed;
}

async function lookupClient(toNumber: string | null): Promise<string | null> {
  if (!toNumber) return null;
  const { data } = await admin
    .from("client_phone_numbers")
    .select("client_id")
    .eq("phone_number", toNumber)
    .maybeSingle();
  return data?.client_id ?? null;
}

async function lookupEmployeeBySipgateUser(
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await admin
    .from("employees")
    .select("id")
    .eq("sipgate_user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

function parseFields(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    // sipgate can send user[] entries; keep last value under base key
    out[k] = v;
  }
  return out;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!SIPGATE_WEBHOOK_TOKEN || token !== SIPGATE_WEBHOOK_TOKEN) {
    return new Response("unauthorized", { status: 401 });
  }

  if (req.method !== "POST") {
    return new Response("ok", { status: 200 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let params: URLSearchParams;
  let bodyText = "";
  try {
    bodyText = await req.text();
    if (contentType.includes("application/json")) {
      const j = JSON.parse(bodyText);
      params = new URLSearchParams(
        Object.entries(j).map(([k, v]) => [k, String(v ?? "")]),
      );
    } else {
      params = new URLSearchParams(bodyText);
    }
  } catch (e) {
    console.error("[sipgate-webhook] failed to parse body", e);
    return new Response("bad request", { status: 400 });
  }

  const fields = parseFields(params);
  const event = (fields.event ?? "").toLowerCase();
  const callId = fields.callId;
  if (!callId) {
    console.warn("[sipgate-webhook] missing callId", fields);
    return new Response("ok", { status: 200 });
  }

  const direction = (fields.direction ?? "in").toLowerCase() === "out"
    ? "out"
    : "in";
  const fromNumber = normalizeNumber(fields.from);
  const toNumber = normalizeNumber(fields.to);

  try {
    if (event === "newcall") {
      const clientId = await lookupClient(toNumber);
      const { error } = await admin
        .from("sipgate_calls")
        .upsert(
          {
            sipgate_call_id: callId,
            direction,
            from_number: fromNumber,
            to_number: toNumber,
            client_id: clientId,
            status: "ringing",
            started_at: new Date().toISOString(),
            caller_name: fields.callerName ?? fields.fromName ?? null,
            raw_payload: fields,
          },
          { onConflict: "sipgate_call_id" },
        );
      if (error) console.error("[sipgate-webhook] insert failed", error);
    } else if (event === "answer") {
      const sipgateUser = fields.user ?? fields["user[]"] ?? null;
      const empId = await lookupEmployeeBySipgateUser(sipgateUser);
      const { error } = await admin
        .from("sipgate_calls")
        .update({
          status: "answered",
          answered_at: new Date().toISOString(),
          answered_by_employee_id: empId,
          raw_payload: fields,
        })
        .eq("sipgate_call_id", callId);
      if (error) console.error("[sipgate-webhook] answer update failed", error);
    } else if (event === "hangup") {
      // Determine missed vs ended based on whether it was answered
      const { data: existing } = await admin
        .from("sipgate_calls")
        .select("answered_at")
        .eq("sipgate_call_id", callId)
        .maybeSingle();
      const finalStatus = existing?.answered_at ? "ended" : "missed";
      const { error } = await admin
        .from("sipgate_calls")
        .update({
          status: finalStatus,
          ended_at: new Date().toISOString(),
          raw_payload: fields,
        })
        .eq("sipgate_call_id", callId);
      if (error) console.error("[sipgate-webhook] hangup update failed", error);
    } else {
      console.log("[sipgate-webhook] ignored event", event);
    }
  } catch (e) {
    console.error("[sipgate-webhook] handler error", e);
    return new Response("error", { status: 500 });
  }

  return new Response("", { status: 200 });
});
