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

export type Segment = { start: string; end: string };
export type DayEntry = { active: boolean; segments: Segment[] };
export type DayMap = Record<DayKey, DayEntry>;
export type ScheduleMode = "uniform" | "per_day";

export const DEFAULT_SEGMENT: Segment = { start: "09:00", end: "17:00" };

export function emptySegment(): Segment {
  return { ...DEFAULT_SEGMENT };
}

export function emptyDays(): DayMap {
  return DAY_KEYS.reduce((acc, k) => {
    acc[k] = { active: false, segments: [emptySegment()] };
    return acc;
  }, {} as DayMap);
}

/** Standard: Mo–Fr 09:00–17:00 */
export function defaultDays(): DayMap {
  const d = emptyDays();
  (["mon", "tue", "wed", "thu", "fri"] as DayKey[]).forEach((k) => (d[k].active = true));
  return d;
}

function normalizeTime(v: unknown, fallback: string): string {
  return typeof v === "string" && /^\d{1,2}:\d{2}/.test(v) ? v.slice(0, 5) : fallback;
}

/** Normalisiert jsonb-Daten (altes Format start/end oder neues segments-Format). */
export function normalizeDays(raw: unknown): DayMap {
  const base = emptyDays();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const key of DAY_KEYS) {
    const v = obj[key] as Record<string, unknown> | undefined;
    if (!v || typeof v !== "object") continue;
    let segments: Segment[] = [];
    if (Array.isArray(v.segments)) {
      segments = (v.segments as unknown[])
        .filter((s) => s && typeof s === "object")
        .map((s) => {
          const seg = s as Record<string, unknown>;
          return {
            start: normalizeTime(seg.start, DEFAULT_SEGMENT.start),
            end: normalizeTime(seg.end, DEFAULT_SEGMENT.end),
          };
        });
    }
    if (segments.length === 0) {
      segments = [
        {
          start: normalizeTime(v.start, DEFAULT_SEGMENT.start),
          end: normalizeTime(v.end, DEFAULT_SEGMENT.end),
        },
      ];
    }
    base[key] = { active: !!v.active, segments };
  }
  return base;
}

/** Für die Datenbank: neues Format plus start/end des ersten Blocks (Abwärtskompatibilität). */
export function serializeDays(days: DayMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of DAY_KEYS) {
    const d = days[key];
    const first = d.segments[0] ?? emptySegment();
    out[key] = {
      active: d.active,
      segments: d.segments.map((s) => ({ start: s.start, end: s.end })),
      start: first.start,
      end: first.end,
    };
  }
  return out;
}

export function cloneDays(days: DayMap): DayMap {
  return JSON.parse(JSON.stringify(days)) as DayMap;
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function segmentMinutes(seg: Segment): number {
  const diff = toMinutes(seg.end) - toMinutes(seg.start);
  return diff >= 0 ? diff : diff + 24 * 60;
}

/** Dauer eines Tages in Minuten (Summe aller Blöcke). */
export function dayMinutes(entry: DayEntry): number {
  if (!entry.active) return 0;
  return entry.segments.reduce((sum, s) => sum + segmentMinutes(s), 0);
}

export function weekMinutes(days: DayMap): number {
  return DAY_KEYS.reduce((sum, k) => sum + dayMinutes(days[k]), 0);
}

/** Fehlermeldungen für einen Tag (leeres Array = gültig). */
export function validateDay(entry: DayEntry): string[] {
  if (!entry.active) return [];
  const errors: string[] = [];
  if (entry.segments.length === 0) return ["Mindestens ein Zeitblock nötig."];
  entry.segments.forEach((s, i) => {
    if (toMinutes(s.end) <= toMinutes(s.start)) {
      errors.push(`Block ${i + 1}: Ende muss nach dem Start liegen.`);
    }
  });
  const sorted = entry.segments
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
      errors.push("Zeitblöcke überschneiden sich.");
      break;
    }
  }
  return errors;
}

export function validateDays(days: DayMap): boolean {
  return DAY_KEYS.every((k) => validateDay(days[k]).length === 0);
}

/** "37,5 Std." */
export function fmtHours(minutes: number): string {
  const h = minutes / 60;
  const rounded = Math.round(h * 100) / 100;
  return `${rounded.toString().replace(".", ",")} Std.`;
}

/** "7:30 Std." kompakt für Tageszeilen. */
export function fmtHoursShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} Std.` : `${h}:${String(m).padStart(2, "0")} Std.`;
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
