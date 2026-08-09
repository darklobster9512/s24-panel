import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type CallerAction =
  | "meta"
  | "list_interviews"
  | "set_status"
  | "set_mailbox"
  | "send_panel_link"
  | "send_panel_link_email"
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

export type InterviewNote = {
  status: "erfolgreich" | "fehlgeschlagen" | string;
  text: string;
  author: string | null;
  created_at: string | null;
};

export type RecruitmentInterview = {
  id: string;
  applicationId: string | null;
  date: string | null;
  time: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  employment: string | null;
  status: string | null;
  slot: number | null;
  slotTotal: number | null;
  reminderCount: number;
  probetagInviteCount: number;
  trialDay: Record<string, any> | null;
  notes: InterviewNote[];
  raw: Record<string, any>;
};

function pick(o: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

/** Normalisiert die Antwort der externen Caller-API auf ein stabiles Format. */
export function normalizeInterview(item: Record<string, any>): RecruitmentInterview {
  const first = pick(item, ["first_name", "vorname", "firstName"]);
  const last = pick(item, ["last_name", "nachname", "lastName"]);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pick(item, ["name", "full_name", "fullName", "applicant_name"]) ||
    "Unbekannt";

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

  const rawNotes = Array.isArray(item.notes) ? item.notes : [];
  const notes: InterviewNote[] = rawNotes
    .filter((n: any) => n && typeof n === "object")
    .map((n: any) => ({
      status: String(n.status ?? ""),
      text: String(n.text ?? ""),
      author: n.author ?? null,
      created_at: n.created_at ?? null,
    }));

  return {
    id: String(pick(item, ["id", "interview_id", "uuid"]) ?? crypto.randomUUID()),
    applicationId: pick(item, ["application_id"]),
    date: date ? String(date).slice(0, 10) : null,
    time: time ? String(time).slice(0, 5) : null,
    name: String(name).trim(),
    phone: pick(item, ["phone", "handynummer", "telefon", "phone_number", "mobile"]),
    email: pick(item, ["email", "e_mail", "mail"]),
    employment: pick(item, ["employment_type", "anstellung", "employment", "position"]),
    status: pick(item, ["status", "state"]),
    slot: typeof item.slot === "number" ? item.slot : null,
    slotTotal: typeof item.slot_total === "number" ? item.slot_total : null,
    reminderCount: Number(item.reminder_count ?? 0),
    probetagInviteCount: Number(item.probetag_invite_count ?? 0),
    trialDay: item.trial_day ?? null,
    notes,
    raw: item,
  };
}

export function extractList(data: any): Record<string, any>[] {
  if (Array.isArray(data)) return data;
  for (const key of ["items", "interviews", "data", "results", "rows", "appointments"]) {
    const v = data?.[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export type InterviewView = "default" | "past" | "future";

export type InterviewPage = {
  items: RecruitmentInterview[];
  total: number;
  page: number;
  pageSize: number;
};

/** Ruft eine Seite der Terminliste ab (Protokoll der externen caller-api). */
export async function listInterviews(
  view: InterviewView,
  page = 0,
  search = "",
  employeeId?: string,
): Promise<InterviewPage> {
  const data = await callerApi<any>("list_interviews", {
    view,
    page,
    ...(search ? { search } : {}),
    ...(employeeId ? { employee_id: employeeId } : {}),
  });
  return {
    items: extractList(data).map(normalizeInterview),
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? page),
    pageSize: Number(data?.page_size ?? 25),
  };
}

/** Lädt alle Seiten einer Ansicht (mit Sicherheitsgrenze gegen Endlosschleifen). */
async function fetchAllPages(
  view: InterviewView,
  search: string,
  employeeId?: string,
  maxPages = 20,
): Promise<{ items: RecruitmentInterview[]; total: number; pageSize: number }> {
  const first = await listInterviews(view, 0, search, employeeId);
  const items = [...first.items];
  const pageSize = first.pageSize || 25;
  let page = 1;
  while (items.length < first.total && page < maxPages) {
    const next = await listInterviews(view, page, search, employeeId);
    if (next.items.length === 0) break;
    items.push(...next.items);
    page++;
  }
  return { items, total: first.total, pageSize };
}

/**
 * "Anstehend" = heutige/morgige Termine (view=default) + alles ab übermorgen (view=future).
 * Beide Bereiche werden vollständig geladen, global sortiert und erst danach paginiert,
 * damit die Reihenfolge über Seitengrenzen hinweg korrekt bleibt.
 */
export async function listUpcomingInterviews(
  page = 0,
  search = "",
  employeeId?: string,
): Promise<InterviewPage> {
  const [today, later] = await Promise.all([
    fetchAllPages("default", search, employeeId),
    fetchAllPages("future", search, employeeId),
  ]);

  const merged = [...today.items, ...later.items].sort((a, b) => {
    const ka = `${a.date ?? "9999-12-31"} ${a.time ?? "23:59"}`;
    const kb = `${b.date ?? "9999-12-31"} ${b.time ?? "23:59"}`;
    return ka.localeCompare(kb);
  });

  const pageSize = Math.max(today.pageSize, later.pageSize) || 25;
  const start = page * pageSize;

  return {
    items: merged.slice(start, start + pageSize),
    total: merged.length,
    page,
    pageSize,
  };
}



/** Sucht einen Termin über alle Ansichten hinweg anhand seiner ID. */
export async function findInterviewById(
  id: string,
): Promise<RecruitmentInterview | null> {
  const views: InterviewView[] = ["default", "future", "past"];
  for (const view of views) {
    for (let page = 0; page < 5; page++) {
      const res = await listInterviews(view, page);
      const hit = res.items.find((r) => r.id === id);
      if (hit) return hit;
      if ((page + 1) * res.pageSize >= res.total) break;
    }
  }
  return null;
}
