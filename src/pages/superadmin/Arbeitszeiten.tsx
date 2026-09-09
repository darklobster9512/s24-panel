import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";

import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  DAY_KEYS,
  DAY_SHORT,
  DayMap,
  addDays,
  addWeeks,
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

interface EmployeeRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  login_email: string | null;
}

export default function Arbeitszeiten() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [q, setQ] = useState("");
  const weekKey = toISODate(weekStart);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["superadmin-work-schedules", weekKey],
    queryFn: async () => {
      const [empRes, baseRes, weekRes] = await Promise.all([
        db
          .from("employees")
          .select("id, first_name, last_name, login_email")
          .eq("is_draft", false)
          .order("first_name", { ascending: true }),
        db.from("work_schedules").select("employee_id, days"),
        db.from("work_schedule_weeks").select("employee_id, days").eq("week_start", weekKey),
      ]);
      if (empRes.error) throw empRes.error;
      if (baseRes.error) throw baseRes.error;
      if (weekRes.error) throw weekRes.error;

      const base = new Map<string, DayMap>();
      (baseRes.data ?? []).forEach((r: any) => base.set(r.employee_id, normalizeDays(r.days)));
      const overrides = new Map<string, DayMap>();
      (weekRes.data ?? []).forEach((r: any) => overrides.set(r.employee_id, normalizeDays(r.days)));

      return (empRes.data ?? []).map((e: EmployeeRow) => {
        const override = overrides.get(e.id) ?? null;
        const plan = override ?? base.get(e.id) ?? null;
        return {
          employee: e,
          days: plan ?? emptyDays(),
          hasPlan: !!plan,
          isOverride: !!override,
        };
      });
    },
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = data ?? [];
    if (!needle) return list;
    return list.filter((r: any) =>
      `${r.employee.first_name ?? ""} ${r.employee.last_name ?? ""} ${r.employee.login_email ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="Arbeitszeiten"
        subtitle="Wochenübersicht der geplanten Arbeitszeiten aller Mitarbeiter."
      />

      <Panel>
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

          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Mitarbeiter suchen…"
              className="h-9 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {isPending ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Arbeitszeiten…
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-destructive">
            Fehler: {(error as Error).message}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Keine Mitarbeiter gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 bg-card px-2 pb-2 text-left">Mitarbeiter</th>
                  {DAY_KEYS.map((k, i) => (
                    <th key={k} className="px-2 pb-2 text-left font-medium">
                      {DAY_SHORT[k]}{" "}
                      <span className="text-[10px] normal-case text-muted-foreground/70">
                        {addDays(weekStart, i).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </th>
                  ))}
                  <th className="px-2 pb-2 text-right">Summe</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const name =
                    `${r.employee.first_name ?? ""} ${r.employee.last_name ?? ""}`.trim() ||
                    r.employee.login_email ||
                    "—";
                  return (
                    <tr key={r.employee.id} className="border-t border-border/60">
                      <td className="sticky left-0 bg-card px-2 py-2.5 align-top">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{name}</span>
                          {r.isOverride && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                              abweichend
                            </Badge>
                          )}
                        </div>
                      </td>
                      {DAY_KEYS.map((k) => {
                        const d = r.days[k];
                        return (
                          <td key={k} className="px-2 py-2.5 align-top">
                            {!r.hasPlan ? (
                              <span className="text-xs text-muted-foreground/60">—</span>
                            ) : d.active ? (
                              <div className="flex flex-col items-start gap-1">
                                {d.segments.map((s: any, si: number) => (
                                  <span
                                    key={si}
                                    className="inline-flex rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-foreground"
                                  >
                                    {s.start}–{s.end}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">frei</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2.5 text-right align-top font-medium">
                        {r.hasPlan ? fmtHours(weekMinutes(r.days)) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
