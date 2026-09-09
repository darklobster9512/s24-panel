import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  defaultDays,
  emptyDays,
  fmtHours,
  fmtRange,
  
  isoWeekNumber,
  normalizeDays,
  startOfWeek,
  toISODate,
  weekMinutes,
} from "@/lib/work-schedule";

const db = supabase as any;

function DayRow({
  label,
  entry,
  onChange,
  disabled,
  showTimes = true,
}: {
  label: string;
  entry: { active: boolean; start: string; end: string };
  onChange: (next: { active: boolean; start: string; end: string }) => void;
  disabled?: boolean;
  showTimes?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5">
      <Switch
        checked={entry.active}
        disabled={disabled}
        onCheckedChange={(v) => onChange({ ...entry, active: v })}
      />
      <span className="w-28 text-sm font-medium">{label}</span>
      {showTimes ? (
        entry.active ? (
          <div className="flex items-center gap-2">
            <Input
              type="time"
              className="h-9 w-[120px]"
              value={entry.start}
              disabled={disabled}
              onChange={(e) => onChange({ ...entry, start: e.target.value })}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="time"
              className="h-9 w-[120px]"
              value={entry.end}
              disabled={disabled}
              onChange={(e) => onChange({ ...entry, end: e.target.value })}
            />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">frei</span>
        )
      ) : null}
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

  const [mode, setMode] = useState<ScheduleMode>("uniform");
  const [days, setDays] = useState<DayMap>(defaultDays());
  const [uniformStart, setUniformStart] = useState("09:00");
  const [uniformEnd, setUniformEnd] = useState("17:00");
  const [loadedBase, setLoadedBase] = useState(false);

  useEffect(() => {
    if (loadedBase || baseQuery.isPending || !employeeId) return;
    const row = baseQuery.data;
    if (row) {
      const d = normalizeDays(row.days);
      setDays(d);
      setMode(row.mode === "per_day" ? "per_day" : "uniform");
      const first = DAY_KEYS.map((k) => d[k]).find((e) => e.active);
      if (first) {
        setUniformStart(first.start);
        setUniformEnd(first.end);
      }
    }
    setLoadedBase(true);
  }, [baseQuery.data, baseQuery.isPending, employeeId, loadedBase]);

  const baseDaysForSave = useMemo<DayMap>(() => {
    if (mode === "uniform") {
      const next = emptyDays();
      DAY_KEYS.forEach((k) => {
        next[k] = { active: days[k].active, start: uniformStart, end: uniformEnd };
      });
      return next;
    }
    return days;
  }, [mode, days, uniformStart, uniformEnd]);

  const saveBase = useMutation({
    mutationFn: async () => {
      if (!employeeId) throw new Error("Kein Mitarbeiterprofil gefunden.");
      const { error } = await db
        .from("work_schedules")
        .upsert(
          { employee_id: employeeId, mode, days: baseDaysForSave },
          { onConflict: "employee_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Standardplan gespeichert");
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

  const savedBaseDays = baseQuery.data ? normalizeDays(baseQuery.data.days) : baseDaysForSave;
  const effectiveWeek = weekDraft ?? savedBaseDays;
  const hasOverride = !!weekDraft;

  const saveWeek = useMutation({
    mutationFn: async () => {
      if (!employeeId || !weekDraft) throw new Error("Keine Abweichung zu speichern.");
      const { error } = await db
        .from("work_schedule_weeks")
        .upsert(
          { employee_id: employeeId, week_start: weekKey, days: weekDraft },
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

  return (
    <>
      <PageHeader
        title="Meine Arbeitszeiten"
        subtitle="Lege deinen Standardplan fest und plane einzelne Wochen abweichend."
      />

      <Tabs defaultValue="standard">
        <TabsList className="mb-4">
          <TabsTrigger value="standard">Standardplan</TabsTrigger>
          <TabsTrigger value="woche">Wochenplanung</TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <Panel
            title="Standardplan"
            action={
              <Badge variant="secondary">{fmtHours(weekMinutes(baseDaysForSave))} / Woche</Badge>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "uniform" ? "default" : "outline"}
                onClick={() => setMode("uniform")}
              >
                Jeden Tag gleich
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "per_day" ? "default" : "outline"}
                onClick={() => setMode("per_day")}
              >
                Pro Tag unterschiedlich
              </Button>
            </div>

            {mode === "uniform" && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface/60 px-3 py-3">
                <span className="text-sm font-medium">Arbeitszeit an aktiven Tagen</span>
                <Input
                  type="time"
                  className="h-9 w-[120px]"
                  value={uniformStart}
                  onChange={(e) => setUniformStart(e.target.value)}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  className="h-9 w-[120px]"
                  value={uniformEnd}
                  onChange={(e) => setUniformEnd(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              {DAY_KEYS.map((k: DayKey) => (
                <DayRow
                  key={k}
                  label={DAY_LABELS[k]}
                  entry={
                    mode === "uniform"
                      ? { active: days[k].active, start: uniformStart, end: uniformEnd }
                      : days[k]
                  }
                  showTimes={mode === "per_day"}
                  onChange={(next) => setDays({ ...days, [k]: next })}
                />
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => saveBase.mutate()} disabled={saveBase.isPending} className="gap-2">
                {saveBase.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Standardplan speichern
              </Button>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="woche">
          <Panel
            title="Wochenplanung"
            action={
              <Badge variant="secondary">{fmtHours(weekMinutes(effectiveWeek))} / Woche</Badge>
            }
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
                  Standardplan
                </Badge>
              )}
            </div>

            {isPast && (
              <div className="mb-3 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
                Vergangene Wochen können nicht mehr bearbeitet werden.
              </div>
            )}

            <div className="space-y-2">
              {DAY_KEYS.map((k: DayKey, i) => (
                <DayRow
                  key={k}
                  label={`${DAY_LABELS[k]} · ${addDays(weekStart, i).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}`}
                  entry={effectiveWeek[k]}
                  disabled={isPast || !hasOverride}
                  onChange={(next) =>
                    setWeekDraft({ ...(weekDraft ?? effectiveWeek), [k]: next } as DayMap)
                  }
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {!hasOverride ? (
                <Button
                  disabled={isPast}
                  onClick={() =>
                    setWeekDraft(
                      JSON.parse(JSON.stringify(effectiveWeek)) as DayMap,
                    )
                  }
                >
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
                    disabled={isPast || saveWeek.isPending}
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
