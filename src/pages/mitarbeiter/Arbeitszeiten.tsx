import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eraser,
  Loader2,
  RotateCcw,
  Save,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { DayRow } from "@/components/arbeitszeiten/DayRow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOutboundProfile } from "@/hooks/use-outbound-profile";
import {
  DAY_KEYS,
  DAY_LABELS,
  DayKey,
  DayMap,
  ScheduleMode,
  addDays,
  addWeeks,
  cloneDays,
  defaultDays,
  emptyDays,
  fmtHours,
  fmtRange,
  isoWeekNumber,
  normalizeDays,
  serializeDays,
  startOfWeek,
  toISODate,
  validateDays,
  weekMinutes,
} from "@/lib/work-schedule";

const db = supabase as any;

function WeekGrid({
  days,
  weekStart,
  disabled,
  onChange,
}: {
  days: DayMap;
  weekStart?: Date;
  disabled?: boolean;
  onChange: (next: DayMap) => void;
}) {
  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
      {DAY_KEYS.map((k: DayKey, i) => (
        <DayRow
          key={k}
          label={DAY_LABELS[k]}
          dateLabel={
            weekStart
              ? addDays(weekStart, i).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                })
              : undefined
          }
          entry={days[k]}
          disabled={disabled}
          onChange={(next) => onChange({ ...days, [k]: next })}
        />
      ))}
    </div>
  );
}

export default function Arbeitszeiten() {
  const qc = useQueryClient();
  const { data: profile, isPending: profilePending } = useOutboundProfile();
  const employeeId = profile?.employeeId ?? null;

  /* ---------------- Standardplan ---------------- */
  const baseQuery = useQuery({
    enabled: !!employeeId,
    queryKey: ["work-schedule", employeeId],
    queryFn: async () => {
      const { data, error } = await db
        .from("work_schedules")
        .select("id, mode, days")
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; mode: ScheduleMode; days: unknown } | null;
    },
  });

  const [days, setDays] = useState<DayMap>(defaultDays());
  const [savedDays, setSavedDays] = useState<DayMap>(defaultDays());
  const [loadedBase, setLoadedBase] = useState(false);

  useEffect(() => {
    if (loadedBase || baseQuery.isPending || !employeeId) return;
    const row = baseQuery.data;
    if (row) {
      const d = normalizeDays(row.days);
      setDays(d);
      setSavedDays(cloneDays(d));
    }
    setLoadedBase(true);
  }, [baseQuery.data, baseQuery.isPending, employeeId, loadedBase]);

  const baseDirty = useMemo(
    () => JSON.stringify(days) !== JSON.stringify(savedDays),
    [days, savedDays],
  );
  const baseValid = validateDays(days);

  const saveBase = useMutation({
    mutationFn: async () => {
      if (!employeeId) throw new Error("Kein Mitarbeiterprofil gefunden.");
      const { error } = await db.from("work_schedules").upsert(
        { employee_id: employeeId, mode: "per_day", days: serializeDays(days) },
        { onConflict: "employee_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Standardplan gespeichert");
      setSavedDays(cloneDays(days));
      qc.invalidateQueries({ queryKey: ["work-schedule", employeeId] });
      qc.invalidateQueries({ queryKey: ["work-schedule-week"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ---------------- Wochenplanung ---------------- */
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const weekKey = toISODate(weekStart);
  const currentWeekKey = toISODate(startOfWeek(new Date()));
  const isPast = weekKey < currentWeekKey;

  const weekQuery = useQuery({
    enabled: !!employeeId,
    queryKey: ["work-schedule-week", employeeId, weekKey],
    queryFn: async () => {
      const { data, error } = await db
        .from("work_schedule_weeks")
        .select("id, days")
        .eq("employee_id", employeeId)
        .eq("week_start", weekKey)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; days: unknown } | null;
    },
  });

  const [weekDraft, setWeekDraft] = useState<DayMap | null>(null);

  useEffect(() => {
    setWeekDraft(weekQuery.data ? normalizeDays(weekQuery.data.days) : null);
  }, [weekQuery.data, weekKey]);

  const effectiveWeek = weekDraft ?? savedDays;
  const hasOverride = !!weekDraft;
  const weekValid = validateDays(effectiveWeek);

  const saveWeek = useMutation({
    mutationFn: async () => {
      if (!employeeId || !weekDraft) throw new Error("Keine Abweichung zu speichern.");
      const { error } = await db.from("work_schedule_weeks").upsert(
        { employee_id: employeeId, week_start: weekKey, days: serializeDays(weekDraft) },
        { onConflict: "employee_id,week_start" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Woche gespeichert");
      qc.invalidateQueries({ queryKey: ["work-schedule-week", employeeId, weekKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetWeek = useMutation({
    mutationFn: async () => {
      if (!employeeId) return;
      const { error } = await db
        .from("work_schedule_weeks")
        .delete()
        .eq("employee_id", employeeId)
        .eq("week_start", weekKey);
      if (error) throw error;
    },
    onSuccess: () => {
      setWeekDraft(null);
      toast.success("Woche folgt wieder dem Standardplan");
      qc.invalidateQueries({ queryKey: ["work-schedule-week", employeeId, weekKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profilePending || (employeeId && baseQuery.isPending)) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Arbeitszeiten…
      </div>
    );
  }

  if (!employeeId) {
    return (
      <>
        <PageHeader title="Meine Arbeitszeiten" subtitle="Arbeitszeiten planen und bearbeiten." />
        <Panel>
          <div className="py-10 text-center text-sm text-muted-foreground">
            Für dieses Konto ist kein Mitarbeiterprofil hinterlegt.
          </div>
        </Panel>
      </>
    );
  }

  const applyMonFri = () => {
    const next = cloneDays(days);
    DAY_KEYS.forEach((k) => {
      next[k].active = !["sat", "sun"].includes(k);
    });
    setDays(next);
  };

  const copyMonday = () => {
    const next = cloneDays(days);
    const source = next.mon.segments;
    DAY_KEYS.forEach((k) => {
      if (next[k].active) next[k].segments = JSON.parse(JSON.stringify(source));
    });
    setDays(next);
  };

  return (
    <>
      <PageHeader
        title="Meine Arbeitszeiten"
        subtitle="Standardplan festlegen und einzelne Wochen abweichend planen. Pro Tag sind mehrere Zeitblöcke möglich."
      />

      <Tabs defaultValue="standard">
        <TabsList className="mb-4">
          <TabsTrigger value="standard">Standardplan</TabsTrigger>
          <TabsTrigger value="woche">Einzelne Woche</TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <Panel
            title="Standardplan"
            action={<Badge variant="secondary">{fmtHours(weekMinutes(days))} / Woche</Badge>}
          >
            <p className="mb-4 text-sm text-muted-foreground">
              Dieser Plan gilt dauerhaft für jede Woche, solange keine Abweichung hinterlegt ist.
            </p>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={applyMonFri}>
                Mo–Fr übernehmen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={copyMonday}
              >
                <Copy className="h-3.5 w-3.5" /> Montag auf alle aktiven Tage
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setDays(emptyDays())}
              >
                <Eraser className="h-3.5 w-3.5" /> Alles leeren
              </Button>
            </div>

            {baseDirty && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                <span className="font-medium">Ungespeicherte Änderungen</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setDays(cloneDays(savedDays))}
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Verwerfen
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={saveBase.isPending || !baseValid}
                    onClick={() => saveBase.mutate()}
                  >
                    {saveBase.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Speichern
                  </Button>
                </div>
              </div>
            )}

            <WeekGrid days={days} onChange={setDays} />

            {!baseValid && (
              <p className="mt-3 text-xs text-destructive">
                Bitte zuerst die markierten Zeitblöcke korrigieren.
              </p>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="woche">
          <Panel
            title="Einzelne Woche"
            action={<Badge variant="secondary">{fmtHours(weekMinutes(effectiveWeek))} / Woche</Badge>}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setWeekStart(addWeeks(weekStart, -1))}
                aria-label="Vorherige Woche"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">KW {isoWeekNumber(weekStart)}</span>
                <span className="text-muted-foreground">{fmtRange(weekStart)}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                aria-label="Nächste Woche"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
                Aktuelle Woche
              </Button>
              {hasOverride ? (
                <Badge className="ml-auto">Abweichend geplant</Badge>
              ) : (
                <Badge variant="outline" className="ml-auto">
                  Folgt dem Standardplan
                </Badge>
              )}
            </div>

            {isPast && (
              <div className="mb-3 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
                Vergangene Wochen können nicht mehr bearbeitet werden.
              </div>
            )}

            <WeekGrid
              days={effectiveWeek}
              weekStart={weekStart}
              disabled={isPast || !hasOverride}
              onChange={(next) => setWeekDraft(next)}
            />

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {!hasOverride ? (
                <Button disabled={isPast} onClick={() => setWeekDraft(cloneDays(effectiveWeek))}>
                  Diese Woche abweichend planen
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={isPast || resetWeek.isPending}
                    onClick={() => resetWeek.mutate()}
                  >
                    <RotateCcw className="h-4 w-4" /> Auf Standard zurücksetzen
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={isPast || saveWeek.isPending || !weekValid}
                    onClick={() => saveWeek.mutate()}
                  >
                    {saveWeek.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Woche speichern
                  </Button>
                </>
              )}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
