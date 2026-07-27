import { supabase } from "@/integrations/supabase/client";

export type ActivityEntry = {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
};

/**
 * Schreibt einen Eintrag ins Aktivitätsprotokoll.
 * Fehler werden nur geloggt, damit die eigentliche Aktion nie blockiert wird.
 */
export async function logActivity(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any>;
}) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    const { error } = await (supabase as any).from("activity_log").insert({
      actor_user_id: user.id,
      actor_email: user.email ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      details: params.details ?? {},
    });
    if (error) console.error("[activityLog] insert failed:", error.message);
  } catch (e) {
    console.error("[activityLog] unexpected error:", e);
  }
}

export function formatActivityTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
