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

const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>';

function xmlResponse(body: string, status = 200): Response {
  return new Response(`${XML_PROLOG}\n${body}`, {
    status,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

const EMPTY_RESPONSE_XML = "<Response/>";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!SIPGATE_WEBHOOK_TOKEN || token !== SIPGATE_WEBHOOK_TOKEN) {
    console.warn("[sipgate-webhook] unauthorized", {
      method: req.method,
      hasToken: !!token,
    });
    return new Response("unauthorized", { status: 401 });
  }

  // Reconstruct the callback URL (this same endpoint incl. token) so sipgate
  // will POST answer/hangup follow-up events back to us.
  const callbackUrl = `${url.origin}${url.pathname}?token=${encodeURIComponent(
    SIPGATE_WEBHOOK_TOKEN,
  )}`;

  if (req.method !== "POST") {
    console.log("[sipgate-webhook] non-POST request", { method: req.method });
    return xmlResponse(EMPTY_RESPONSE_XML);
  }

  const contentType = req.headers.get("content-type") ?? "";
  let params: URLSearchParams;
  let bodyText = "";
  try {
    bodyText = await req.text();
    console.log("[sipgate-webhook] incoming", {
      method: req.method,
      contentType,
      rawBody: bodyText,
    });
    if (contentType.includes("application/json")) {
      const j = JSON.parse(bodyText);
      params = new URLSearchParams(
        Object.entries(j).map(([k, v]) => [k, String(v ?? "")]),
      );
    } else {
      params = new URLSearchParams(bodyText);
    }
  } catch (e) {
  } catch (e) {
    console.error("[sipgate-webhook] failed to parse body", e, { bodyText });
    return xmlResponse(EMPTY_RESPONSE_XML, 400);
  }

  const fields = parseFields(params);
  const event = (fields.event ?? "").toLowerCase();
  const callId = fields.callId;
  const origCallId = fields.origCallId ?? fields.originalCallId ?? null;
  console.log("[sipgate-webhook] parsed", {
    event,
    callId,
    origCallId,
    direction: fields.direction,
    from: fields.from,
    to: fields.to,
    allFields: fields,
  });

  if (!callId) {
    console.warn("[sipgate-webhook] missing callId", fields);
    return xmlResponse(EMPTY_RESPONSE_XML);
  }

  const direction = (fields.direction ?? "in").toLowerCase() === "out"
    ? "out"
    : "in";
  const fromNumber = normalizeNumber(fields.from);
  const toNumber = normalizeNumber(fields.to);

  try {
    if (event === "newcall") {
      const clientId = await lookupClient(toNumber);
      const { data, error } = await admin
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
        )
        .select();
      console.log("[sipgate-webhook] newCall result", {
        callId,
        clientId,
        rows: data?.length ?? 0,
        error,
      });
    } else if (event === "answer") {
      const sipgateUser = fields.user ?? fields["user[]"] ?? null;
      const empId = await lookupEmployeeBySipgateUser(sipgateUser);
      const { data, error } = await admin
        .from("sipgate_calls")
        .update({
          status: "answered",
          answered_at: new Date().toISOString(),
          answered_by_employee_id: empId,
          raw_payload: fields,
        })
        .or(
          origCallId
            ? `sipgate_call_id.eq.${callId},sipgate_call_id.eq.${origCallId}`
            : `sipgate_call_id.eq.${callId}`,
        )
        .select();
      console.log("[sipgate-webhook] answer result", {
        callId,
        origCallId,
        empId,
        rowsUpdated: data?.length ?? 0,
        error,
      });
    } else if (event === "hangup") {
      // Determine missed vs ended based on whether it was answered
      const { data: existing } = await admin
        .from("sipgate_calls")
        .select("id, answered_at, sipgate_call_id")
        .or(
          origCallId
            ? `sipgate_call_id.eq.${callId},sipgate_call_id.eq.${origCallId}`
            : `sipgate_call_id.eq.${callId}`,
        )
        .limit(1)
        .maybeSingle();
      console.log("[sipgate-webhook] hangup lookup", {
        callId,
        origCallId,
        existing,
      });
      const finalStatus = existing?.answered_at ? "ended" : "missed";
      const { data, error } = await admin
        .from("sipgate_calls")
        .update({
          status: finalStatus,
          ended_at: new Date().toISOString(),
          raw_payload: fields,
        })
        .or(
          origCallId
            ? `sipgate_call_id.eq.${callId},sipgate_call_id.eq.${origCallId}`
            : `sipgate_call_id.eq.${callId}`,
        )
        .select();
      console.log("[sipgate-webhook] hangup result", {
        callId,
        origCallId,
        finalStatus,
        rowsUpdated: data?.length ?? 0,
        error,
      });
    } else {
      console.warn("[sipgate-webhook] ignored/unknown event", {
        event,
        fields,
      });
    }
  } catch (e) {
    console.error("[sipgate-webhook] handler error", e);
    return xmlResponse(EMPTY_RESPONSE_XML, 500);
  }

  // For newCall we MUST subscribe to follow-up events via onAnswer/onHangup
  // attributes on the <Response> tag, otherwise sipgate never sends answer/hangup.
  if (event === "newcall") {
    const attrs =
      `onAnswer="${callbackUrl}" onHangup="${callbackUrl}" onData="${callbackUrl}"`;
    const body = `<Response ${attrs}/>`;
    console.log("[sipgate-webhook] newCall response", { callbackUrl });
    return xmlResponse(body);
  }

  return xmlResponse(EMPTY_RESPONSE_XML);
});
