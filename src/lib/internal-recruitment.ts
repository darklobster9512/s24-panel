import { supabase } from "@/integrations/supabase/client";

/** Kunde "aigis one GmbH" – Branding für die internen Bewerbungsgespräche. */
export const AIGIS_CLIENT_ID = "b122af54-7a0c-40c5-b33f-6673a3dfd2ca";

/** Stellt sicher, dass ein Mitarbeiter dem aigis-one-Branding zugewiesen ist. */
export async function ensureAigisAssignment(employeeId: string, createdBy: string) {
  const { data: existing } = await supabase
    .from("assignments")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("client_id", AIGIS_CLIENT_ID)
    .maybeSingle();
  if (existing?.id) return;
  const { error } = await supabase.from("assignments").insert({
    employee_id: employeeId,
    client_id: AIGIS_CLIENT_ID,
    created_by: createdBy,
  });
  if (error) console.error("[internal-recruitment] assignment failed", error);
}

export const INTERVIEW_STATUS_OPTIONS = [
  { value: "neu", label: "Offen" },
  { value: "erfolgreich", label: "Erfolgreich" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
  { value: "mailbox", label: "Mailbox" },
];

export const RANKING_OPTIONS = [
  { value: "sehr_gut", label: "Sehr gut" },
  { value: "gut", label: "Gut" },
  { value: "mittel", label: "Mittel" },
  { value: "schlecht", label: "Schlecht" },
];
