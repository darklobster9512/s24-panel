import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Building2, Users, PhoneCall, CheckCircle2, UserPlus, FileSignature } from "lucide-react";

import { PageHeader, Panel, StatCard } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfYesterday() {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function callDuration(row: { started_at: string | null; ended_at: string | null; answered_at: string | null }) {
  if (!row.ended_at) return null;
  const from = row.answered_at ?? row.started_at;
  if (!from) return null;
  const sec = Math.max(0, Math.floor((new Date(row.ended_at).getTime() - new Date(from).getTime()) / 1000));
  return sec;
}

type CallRow = {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  answered_at: string | null;
  status: string | null;
  caller_name: string | null;
  from_number: string | null;
  client: { company_name: string | null } | null;
  employee: { first_name: string | null; last_name: string | null } | null;
  handled: { first_name: string | null; last_name: string | null } | null;
};

export default function Overview() {
  const kpi = useQuery({
    queryKey: ["superadmin-overview-kpi"],
    queryFn: async () => {
      const today = startOfToday().toISOString();
      const yesterday = startOfYesterday().toISOString();
      const weekAgo = daysAgo(7).toISOString();
      const monthAgo = daysAgo(30).toISOString();

      const [clientsTotal, clientsNew, employeesTotal, employeesNew, callsToday, callsYesterday] =
        await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("is_draft", false),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("is_draft", false)
            .gte("created_at", weekAgo),
          supabase.from("employees").select("id", { count: "exact", head: true }),
          supabase.from("employees").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
          supabase.from("sipgate_calls").select("id", { count: "exact", head: true }).gte("started_at", today),
          supabase
            .from("sipgate_calls")
            .select("id", { count: "exact", head: true })
            .gte("started_at", yesterday)
            .lt("started_at", today),
        ]);

      const t = callsToday.count ?? 0;
      const y = callsYesterday.count ?? 0;
      const delta = y === 0 ? (t > 0 ? "+100%" : "±0%") : `${t >= y ? "+" : ""}${Math.round(((t - y) / y) * 100)}%`;

      return {
        clients: clientsTotal.count ?? 0,
        clientsNew: clientsNew.count ?? 0,
        employees: employeesTotal.count ?? 0,
        employeesNew: employeesNew.count ?? 0,
        callsToday: t,
        callsDelta: delta,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["superadmin-overview-recent-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sipgate_calls")
        .select(
          "id, started_at, ended_at, answered_at, status, caller_name, from_number, client:clients(company_name), employee:employees!sipgate_calls_answered_by_employee_id_fkey(first_name,last_name), handled:employees!sipgate_calls_handled_by_employee_id_fkey(first_name,last_name)",
        )
        .order("started_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as CallRow[];
    },
  });

  const live = useQuery({
    queryKey: ["superadmin-overview-live-employees"],
    queryFn: async () => {
      const today = startOfToday().toISOString();
      const { data: employees, error: eErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name");
      if (eErr) throw eErr;

      const { data: todayCalls, error: cErr } = await supabase
        .from("sipgate_calls")
        .select("id, answered_by_employee_id, handled_by_employee_id, ended_at")
        .gte("started_at", today);
      if (cErr) throw cErr;

      return (employees ?? []).map((e) => {
        const mine = (todayCalls ?? []).filter(
          (c) => c.answered_by_employee_id === e.id || c.handled_by_employee_id === e.id,
        );
        const active = mine.some((c) => !c.ended_at);
        return {
          id: e.id,
          name: `${e.first_name ?? ""} ${e.last_name ? e.last_name[0] + "." : ""}`.trim() || "—",
          state: active ? "Im Gespräch" : "Verfügbar",
          calls: mine.length,
        };
      })
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 8);
    },
  });

  const activity = useQuery({
    queryKey: ["superadmin-overview-activity"],
    queryFn: async () => {
      const [newClients, newEmployees, contracts] = await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, created_at")
          .eq("is_draft", false)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("employees")
          .select("id, first_name, last_name, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("employee_contracts")
          .select("id, status, updated_at, employee:employees(first_name,last_name)")
          .eq("status", "completed")
          .order("updated_at", { ascending: false })
          .limit(3),
      ]);

      type Item = { icon: "client" | "employee" | "contract"; label: string; at: string };
      const items: Item[] = [];
      (newClients.data ?? []).forEach((c) =>
        items.push({ icon: "client", label: `Neuer Kunde: ${c.company_name ?? "—"}`, at: c.created_at }),
      );
      (newEmployees.data ?? []).forEach((e) =>
        items.push({
          icon: "employee",
          label: `Neuer Mitarbeiter: ${[e.first_name, e.last_name].filter(Boolean).join(" ") || "—"}`,
          at: e.created_at,
        }),
      );
      (contracts.data ?? []).forEach((k: any) =>
        items.push({
          icon: "contract",
          label: `Arbeitsvertrag abgeschlossen: ${[k.employee?.first_name, k.employee?.last_name].filter(Boolean).join(" ") || "—"}`,
          at: k.updated_at,
        }),
      );
      return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
    },
  });

  return (
    <>
      <PageHeader
        title="Übersicht"
        subtitle="Alle Kunden, Mitarbeiter und Systemmetriken auf einen Blick."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Kunden"
          value={kpi.data ? String(kpi.data.clients) : "—"}
          delta={kpi.data ? `+${kpi.data.clientsNew} diese Woche` : undefined}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label="Mitarbeiter"
          value={kpi.data ? String(kpi.data.employees) : "—"}
          delta={kpi.data ? `+${kpi.data.employeesNew} (30 Tage)` : undefined}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Anrufe heute"
          value={kpi.data ? String(kpi.data.callsToday) : "—"}
          delta={kpi.data ? `${kpi.data.callsDelta} vs. gestern` : undefined}
          icon={<PhoneCall className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Letzte Anrufe"
            action={
              <Button size="sm" variant="outline" asChild>
                <Link to="/superadmin/anrufe">Alle anzeigen</Link>
              </Button>
            }
          >
            {recent.isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : !recent.data || recent.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Anrufe.</p>
            ) : (
              <div className="divide-y divide-border/60">
                <div className="grid grid-cols-[70px_1fr_140px_80px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Uhrzeit</span>
                  <span>Kunde</span>
                  <span>Mitarbeiter</span>
                  <span>Dauer</span>
                  <span>Status</span>
                </div>
                {recent.data.map((c) => {
                  const dur = callDuration(c);
                  const emp = c.handled ?? c.employee;
                  const empName = emp
                    ? `${emp.first_name ?? ""} ${emp.last_name ? emp.last_name[0] + "." : ""}`.trim()
                    : "—";
                  const missed = !c.answered_at && !!c.ended_at;
                  const live = !c.ended_at;
                  return (
                    <div key={c.id} className="grid grid-cols-[70px_1fr_140px_80px_100px] gap-4 py-3 text-sm items-center">
                      <span className="font-mono text-muted-foreground">
                        {c.started_at ? formatTime(c.started_at) : "—"}
                      </span>
                      <span className="font-medium truncate">
                        {c.client?.company_name ?? c.caller_name ?? c.from_number ?? "—"}
                      </span>
                      <span className="text-muted-foreground truncate">{empName}</span>
                      <span className="font-mono">{dur !== null ? formatDuration(dur) : "—"}</span>
                      <Badge
                        variant={live ? "secondary" : missed ? "destructive" : "default"}
                        className="w-fit capitalize"
                      >
                        {live ? "laufend" : missed ? "verpasst" : "beendet"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Mitarbeiter live">
          {live.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : !live.data || live.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Mitarbeiter.</p>
          ) : (
            <ul className="space-y-3">
              {live.data.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        a.state === "Im Gespräch" ? "bg-amber-500" : "bg-primary"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.state}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{a.calls} calls</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Letzte Aktivitäten">
          {activity.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : !activity.data || activity.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Aktivitäten.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {activity.data.map((a, i) => (
                <li key={i} className="flex gap-3">
                  {a.icon === "client" ? (
                    <Building2 className="mt-0.5 h-4 w-4 text-primary" />
                  ) : a.icon === "employee" ? (
                    <UserPlus className="mt-0.5 h-4 w-4 text-primary" />
                  ) : (
                    <FileSignature className="mt-0.5 h-4 w-4 text-primary" />
                  )}
                  <span className="flex-1">{a.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
