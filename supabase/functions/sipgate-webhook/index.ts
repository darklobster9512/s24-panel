// sipgate.io webhook receiver.
// Public endpoint (no JWT), authenticated by a shared token in the URL.
// sipgate posts application/x-www-form-urlencoded with events:
//   newCall  -> ringing
//   answer   -> answered
//   hangup   -> ended/missed
//
// URL example:
//   POST https://<project>.supabase.co/functions/v1/sipgate-webhook?token=<TOKEN>

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIPGATE_WEBHOOK_TOKEN = Deno.env.get("SIPGATE_WEBHOOK_TOKEN")!;

async function createAdminClient() {
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

let adminPromise: Promise<AdminClient> | null = null;

function getAdminClient() {
  adminPromise ??= createAdminClient();
  return adminPromise;
}

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
  const admin = await getAdminClient();
  const { data } = await admin
    .from("client_phone_numbers")
    .select("client_id")
    .eq("phone_number", toNumber)
    .maybeSingle();
  return data?.client_id ?? null;
}

async function lookupEmployeeBySipgateUser(
  candidates: (string | null | undefined)[],
): Promise<string | null> {
  const clean = candidates.map((c) => (c ?? "").trim()).filter(Boolean);
  if (clean.length === 0) return null;
  const admin = await getAdminClient();
  const { data } = await admin
    .from("employees")
    .select("id, sipgate_user_id")
    .in("sipgate_user_id", clean)
    .limit(1);
  return data?.[0]?.id ?? null;
}

async function lookupEmployeeByName(fullName: string | null): Promise<string | null> {
  const name = (fullName ?? "").trim();
  if (!name) return null;
  const parts = name.split(/\s+/);
  if (parts.length < 2) return null;
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  const admin = await getAdminClient();
  const { data } = await admin
    .from("employees")
    .select("id")
    .ilike("first_name", first)
    .ilike("last_name", last)
    .limit(1);
  return data?.[0]?.id ?? null;
}

function parseFields(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    // sipgate can send user[] entries; keep last value under base key
    out[k] = v;
  }
  return out;
}

function parseBodyToParams(bodyText: string, contentType: string): URLSearchParams {
  if (contentType.includes("application/json")) {
    const json = JSON.parse(bodyText);
    return new URLSearchParams(
      Object.entries(json).map(([k, v]) => [k, String(v ?? "")]),
    );
  }
  return new URLSearchParams(bodyText);
}

const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>';

function xmlResponse(body: string, status = 200): Response {
  const payload = `${XML_PROLOG}\n${body}`;
  return new Response(payload, {
    status,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store",
    },
  });
}

const EMPTY_RESPONSE_XML = "<Response/>";

function getPublicCallbackUrl(): string {
  const baseUrl = SUPABASE_URL.replace(/\/+$/, "");
  const callbackUrl = new URL(`${baseUrl}/functions/v1/sipgate-webhook`);
  callbackUrl.searchParams.set("token", SIPGATE_WEBHOOK_TOKEN);
  return callbackUrl.toString();
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function runInBackground(taskFactory: () => Promise<unknown>): void {
  setTimeout(() => {
    taskFactory().catch((error) => {
      console.error("[sipgate-webhook] background task failed", error);
    });
  }, 0);
}

const PUBLIC_CALLBACK_URL = getPublicCallbackUrl();
const ESCAPED_CALLBACK_URL = escapeXmlAttribute(PUBLIC_CALLBACK_URL);
const CALLBACK_RESPONSE_XML = `<Response onAnswer="${ESCAPED_CALLBACK_URL}" onHangup="${ESCAPED_CALLBACK_URL}"></Response>`;

async function processWebhookBody(bodyText: string, contentType: string) {
  let params: URLSearchParams;
  try {
    params = parseBodyToParams(bodyText, contentType);
  } catch (e) {
    console.error("[sipgate-webhook] failed to parse background body", e, { bodyText });
    return;
  }

  const fields = parseFields(params);
  const eventFromBody = (fields.event ?? "").toLowerCase();
  const event = eventFromBody;
  const callId = fields.callId;
  const origCallId = fields.origCallId ?? fields.originalCallId ?? null;

  // Keep-warm ping (cron): no event / explicit keepalive → ignore silently.
  if (!event || event === "keepalive") {
    return;
  }

  if (!callId) {
    console.warn("[sipgate-webhook] missing callId", fields);
    return;
  }

  const direction = (fields.direction ?? "in").toLowerCase() === "out"
    ? "out"
    : "in";
  const fromNumber = normalizeNumber(fields.from);
  const toNumber = normalizeNumber(fields.to);

  if (event === "newcall") {
    console.log("[sipgate-webhook] newCall background", {
      callId,
      direction,
      from: fields.from,
      to: fields.to,
    });
    await persistNewCall(fields, callId, direction, fromNumber, toNumber);
    return;
  }

  console.log("[sipgate-webhook] parsed", {
    event,
    eventFromBody,
    callId,
    origCallId,
    direction: fields.direction,
    from: fields.from,
    to: fields.to,
    allFields: fields,
  });

  const admin = await getAdminClient();

  if (event === "answer") {
    const empId =
      (await lookupEmployeeBySipgateUser([
        fields.fullUserId,
        fields["fullUserId[]"],
        fields.userId,
        fields["userId[]"],
      ])) ??
      (await lookupEmployeeByName(fields.user ?? fields["user[]"] ?? null));
    const updatePayload: Record<string, unknown> = {
      status: "answered",
      answered_at: new Date().toISOString(),
      raw_payload: fields,
    };
    if (empId) {
      updatePayload.answered_by_employee_id = empId;
      updatePayload.handled_by_employee_id = empId;
    }
    const { data, error } = await admin
      .from("sipgate_calls")
      .update(updatePayload)
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
    return;
  }

  if (event === "hangup") {
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
    return;
  }

  console.warn("[sipgate-webhook] ignored/unknown event", {
    event,
    fields,
  });
}

async function persistNewCall(fields: Record<string, string>, callId: string, direction: "in" | "out", fromNumber: string | null, toNumber: string | null) {
  const clientId = await lookupClient(toNumber);
  const admin = await getAdminClient();
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
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Keep-warm ping (pg_cron). No token needed; just wakes the container.
  if (url.searchParams.get("keepalive") === "1") {
    return new Response("ok", { status: 200 });
  }

  const token = url.searchParams.get("token");
  if (!SIPGATE_WEBHOOK_TOKEN || token !== SIPGATE_WEBHOOK_TOKEN) {
    console.warn("[sipgate-webhook] unauthorized", {
      method: req.method,
      hasToken: !!token,
    });
    return new Response("unauthorized", { status: 401 });
  }

  if (req.method !== "POST") return new Response("ok", { status: 200 });

  const contentType = req.headers.get("content-type") ?? "";

  // Cloudflare Worker antwortet Sipgate bereits mit XML.
  // Wir können den Body synchron lesen und verarbeiten.
  let bodyText = "";
  try {
    bodyText = await req.text();
  } catch (e) {
    console.error("[sipgate-webhook] failed to read body", e);
    return new Response("body read failed", { status: 200 });
  }

  try {
    await processWebhookBody(bodyText, contentType);
  } catch (e) {
    console.error("[sipgate-webhook] processing failed", e);
  }

  return new Response("ok", { status: 200 });
});
