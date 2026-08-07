/** Gemeinsame Helfer für Cockpit- und Statistik-Kennzahlen im Mitarbeiter-Panel. */

/** Tages-Schlüssel in lokaler Zeitzone (nicht UTC), damit Abendgespräche korrekt zugeordnet werden. */
export function localDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO-Kalenderwoche als Schlüssel (lokale Zeitzone als Basis). */
export function localWeekKey(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const w = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${w.toString().padStart(2, "0")}`;
}

export function labelForDay(d: Date) {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

/** Beginn eines Tages (lokal) als ISO-String – offset in Tagen relativ zu heute. */
export function startOfLocalDayISO(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

/** Gesprächsdauer aus answered/ended in Sekunden. */
export function durationBetween(from: string | null, to: string | null) {
  if (!from || !to) return 0;
  const sec = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000);
  return sec > 0 ? sec : 0;
}

/** Durchschnitt über alle Werte > 0. */
export function avgPositive(values: number[]) {
  const v = values.filter((x) => x > 0);
  if (v.length === 0) return 0;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

export function sumPositive(values: number[]) {
  return values.filter((x) => x > 0).reduce((a, b) => a + b, 0);
}

/** Sekunden als "1h 12m" bzw. "12m". */
export function fmtGesamt(sec: number) {
  if (!sec || sec < 0) return "0m";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
