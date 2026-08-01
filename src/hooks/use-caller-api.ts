import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type CallerAction =
  | "meta"
  | "list_interviews"
  | "set_status"
  | "send_panel_link"
  | "send_reminder"
  | "resend_success_email";

export class CallerApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Ruft die externe Caller-API ausschließlich über die Proxy-Edge-Function auf. */
export async function callerApi<T = any>(
  action: CallerAction,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("caller-api-proxy", {
    body: { action, ...params },
  });

  if (error) {
    let status = 500;
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      status = error.context?.status ?? 500;
      const raw = await error.context.text();
      try {
        const parsed = JSON.parse(raw);
        message = parsed.error ?? parsed.message ?? raw;
      } catch {
        message = raw || error.message;
      }
    }
    throw new CallerApiError(message, status);
  }

  if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
    throw new CallerApiError(String((data as any).error), 400);
  }

  return data as T;
}

export type RecruitmentInterview = {
  id: string;
  date: string | null;
  time: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  employment: string | null;
  status: string | null;
  notes: string | null;
  raw: Record<string, any>;
};

function pick(o: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

/** Normalisiert die Antwort der externen API auf ein stabiles Format. */
export function normalizeInterview(item: Record<string, any>): RecruitmentInterview {
  const first = pick(item, ["vorname", "first_name", "firstName"]);
  const last = pick(item, ["nachname", "last_name", "lastName"]);
  const name =
    pick(item, ["name", "full_name", "fullName", "applicant_name"]) ??
    [first, last].filter(Boolean).join(" ") ??
    "";

  let date = pick(item, ["appointment_date", "date", "termin_datum", "scheduled_date"]);
  let time = pick(item, ["appointment_time", "time", "termin_zeit", "scheduled_time"]);
  const dt = pick(item, ["scheduled_at", "appointment_at", "starts_at", "datetime"]);
  if ((!date || !time) && typeof dt === "string") {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      date = date ?? d.toISOString().slice(0, 10);
      time = time ?? d.toTimeString().slice(0, 5);
    }
  }

  return {
    id: String(pick(item, ["id", "interview_id", "uuid"]) ?? crypto.randomUUID()),
    date: date ? String(date).slice(0, 10) : null,
    time: time ? String(time).slice(0, 5) : null,
    name: String(name || "Unbekannt").trim(),
    phone: pick(item, ["phone", "handynummer", "telefon", "phone_number", "mobile"]),
    email: pick(item, ["email", "e_mail", "mail"]),
    employment: pick(item, ["anstellung", "employment", "employment_type", "position"]),
    status: pick(item, ["status", "state"]),
    notes: pick(item, ["notes", "notiz", "note"]),
    raw: item,
  };
}

export function extractList(data: any): Record<string, any>[] {
  if (Array.isArray(data)) return data;
  for (const key of ["interviews", "items", "data", "results", "rows", "appointments"]) {
    const v = data?.[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}
