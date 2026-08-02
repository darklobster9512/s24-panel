/**
 * Ersetzt die Variablen in eckigen Klammern im Call-Skript.
 * Unterstützt: [Bewerber_Name], [Mein_Name], [Firmenname]
 */

export const CALL_SCRIPT_VARIABLES = [
  "Bewerber_Name",
  "Mein_Name",
  "Firmenname",
] as const;

/** Nimmt den Nachnamen (letztes Wort) aus einem vollen Namen. */
export function lastNameOf(fullName?: string | null): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts[parts.length - 1];
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Ersetzt alle bekannten Platzhalter (case-insensitiv, Leerzeichen erlaubt).
 * Leere Werte bleiben als Platzhalter sichtbar und werden markiert.
 */
export function renderCallScript(
  html: string,
  values: Partial<Record<(typeof CALL_SCRIPT_VARIABLES)[number], string | null | undefined>>,
): string {
  return html.replace(/\[\s*([A-Za-zÄÖÜäöüß_]+)\s*\]/g, (match, rawKey: string) => {
    const key = CALL_SCRIPT_VARIABLES.find(
      (v) => v.toLowerCase() === String(rawKey).toLowerCase(),
    );
    if (!key) return match;
    const value = (values[key] ?? "").toString().trim();
    if (!value) {
      return `<mark class="rounded bg-amber-200/70 px-1 text-amber-900">[${key}]</mark>`;
    }
    return escapeHtml(value);
  });
}
