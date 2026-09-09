/** Hilfsfunktionen für die Arbeitszeit-Planung (Woche startet Montag). */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Montag",
  tue: "Dienstag",
  wed: "Mittwoch",
  thu: "Donnerstag",
  fri: "Freitag",
  sat: "Samstag",
  sun: "Sonntag",
};

export const DAY_SHORT: Record<DayKey, string> = {
  mon: "Mo",
  tue: "Di",
  wed: "Mi",
  thu: "Do",
  fri: "Fr",
  sat: "Sa",
  sun: "So",
};

export type DayEntry = { active: boolean; start: string; end: string };
export type DayMap = Record<DayKey, DayEntry>;
export type ScheduleMode = "uniform" | "per_day";

export const DEFAULT_DAY: DayEntry = { active: false, start: "09:00", end: "17:00" };

export function emptyDays(): DayMap {
  return DAY_KEYS.reduce((acc, k) => {
    acc[k] = { ...DEFAULT_DAY };
    return acc;
  }, {} as DayMap);
}

/** Standard: Mo–Fr 09:00–17:00 */
export function defaultDays(): DayMap {
  const d = emptyDays();
  (["mon", "tue", "wed", "thu", "fri"] as DayKey[]).forEach((k) => (d[k].active = true));
  return d;
}

/** Normalisiert beliebige jsonb-Daten aus der Datenbank in eine vollständige DayMap. */
export function normalizeDays(raw: unknown): DayMap {
  const base = emptyDays();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const key of DAY_KEYS) {
    const v = obj[key] as Partial<DayEntry> | undefined;
    if (!v || typeof v !== "object") continue;
    base[key] = {
      active: !!v.active,
      start: typeof v.start === "string" && v.start ? v.start : DEFAULT_DAY.start,
      end: typeof v.end === "string" && v.end ? v.end : DEFAULT_DAY.end,
    };
  }
  return base;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Dauer eines Tages in Minuten; Zeiten über Mitternacht werden unterstützt. */
export function dayMinutes(entry: DayEntry): number {
  if (!entry.active) return 0;
  const start = toMinutes(entry.start);
  const end = toMinutes(entry.end);
  const diff = end - start;
  return diff >= 0 ? diff : diff + 24 * 60;
}

export function weekMinutes(days: DayMap): number {
  return DAY_KEYS.reduce((sum, k) => sum + dayMinutes(days[k]), 0);
}

/** "37,5 Std." */
export function fmtHours(minutes: number): string {
  const h = minutes / 60;
  const rounded = Math.round(h * 100) / 100;
  return `${rounded.toString().replace(".", ",")} Std.`;
}

/** Montag der Woche eines Datums (lokale Zeit), als Date um 00:00. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Mo = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/** YYYY-MM-DD ohne UTC-Verschiebung. */
export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromISODate(value: string): Date {
  const [y, m, d] = value.split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function fmtDay(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export function fmtRange(weekStart: Date): string {
  return `${fmtDay(weekStart)} – ${fmtDay(addDays(weekStart, 6))}.${weekStart.getFullYear()}`;
}

/** ISO-Kalenderwoche. */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export type ResolvedWeek = { days: DayMap; isOverride: boolean };

/** Führt Standardplan und optionale Wochenabweichung zusammen. */
export function resolveWeek(base: DayMap | null, override: DayMap | null): ResolvedWeek {
  if (override) return { days: override, isOverride: true };
  return { days: base ?? emptyDays(), isOverride: false };
}
