import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneCall, Clock, StickyNote, Users, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { PageHeader, Panel, StatCard, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative, fmtDauer } from "@/lib/mitarbeiter-mock";

interface RecentCall {
  id: string;
  client_id: string | null;
  caller_name: string | null;
  from_number: string | null;
  to_number: string | null;
  direction: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
}

function durationOf(started: string, ended: string | null): number | null {
  if (!ended) return null;
  const d = (new Date(ended).getTime() - new Date(started).getTime()) / 1000;
  return d > 0 ? Math.round(d) : null;
}

function startOfDay(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export default function Cockpit() {
  const { clients, isAssigned, logoUrls, ids: assignedIds } = useAssignedClients();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [callsToday, setCallsToday] = useState<number | null>(null);
  const [callsYesterday, setCallsYesterday] = useState<number | null>(null);
  const [avgToday, setAvgToday] = useState<number | null>(null);
  const [avgYesterday, setAvgYesterday] = useState<number | null>(null);
  const [openNotes, setOpenNotes] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentCall[]>([]);

  // Mitarbeiter-Profil laden
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (emp) {
        setEmployeeId(emp.id);
        setFirstName(emp.first_name ?? "");
      }
      if (!emp?.first_name) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (prof?.full_name) setFirstName(prof.full_name.split(" ")[0]);
        else setFirstName(user.email?.split("@")[0] ?? "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // KPIs + letzte Anrufe
  useEffect(() => {
    if (assignedIds.length === 0) {
      setCallsToday(0);
      setCallsYesterday(0);
      setAvgToday(0);
      setAvgYesterday(0);
      setRecent([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const todayStart = startOfDay(0);
      const yStart = startOfDay(-1);

      const [{ data: todayRows }, { data: yRows }, { data: recentRows }] = await Promise.all([
        supabase
          .from("sipgate_calls")
          .select("status, started_at, ended_at")
          .in("client_id", assignedIds)
          .gte("started_at", todayStart),
        supabase
          .from("sipgate_calls")
          .select("status, started_at, ended_at")
          .in("client_id", assignedIds)
          .gte("started_at", yStart)
          .lt("started_at", todayStart),
        supabase
          .from("sipgate_calls")
          .select("id, client_id, caller_name, from_number, to_number, direction, status, started_at, ended_at")
          .in("client_id", assignedIds)
          .order("started_at", { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;

      setCallsToday(todayRows?.length ?? 0);
      setCallsYesterday(yRows?.length ?? 0);

      const avg = (rows: any[] | null | undefined) => {
        if (!rows || rows.length === 0) return 0;
        const durations = rows
          .map((r) => durationOf(r.started_at, r.ended_at))
          .filter((d): d is number => d !== null && d > 0);
        if (durations.length === 0) return 0;
        return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      };
      setAvgToday(avg(todayRows));
      setAvgYesterday(avg(yRows));

      setRecent(
        (recentRows ?? []).map((r) => ({
          id: r.id,
          client_id: r.client_id,
          caller_name: r.caller_name,
          from_number: r.from_number,
          to_number: r.to_number,
          direction: r.direction,
          status: r.status,
          started_at: r.started_at,
          ended_at: r.ended_at,
          duration: durationOf(r.started_at, r.ended_at),
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [assignedIds.join(",")]);

  // Offene Notizen (Rückruf gewünscht)
  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("call_notes")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", employeeId)
        .eq("rueckruf_gewuenscht", true);
      if (!cancelled) setOpenNotes(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const callsDelta =
    callsToday !== null && callsYesterday !== null
      ? `${callsToday - callsYesterday >= 0 ? "+" : ""}${callsToday - callsYesterday} vs. gestern`
      : undefined;

  const avgDelta = (() => {
    if (avgToday === null || avgYesterday === null || avgYesterday === 0) return undefined;
    const diff = avgToday - avgYesterday;
    const sign = diff >= 0 ? "+" : "-";
    return `${sign}${fmtDauer(Math.abs(diff))} vs. gestern`;
  })();

  return (
    <>
      <PageHeader
        title={`Willkommen${firstName ? `, ${firstName}` : ""}`}
        subtitle="Übersicht über deine Kunden, Anrufe und offenen Aufgaben."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Anrufe heute"
          value={callsToday === null ? "—" : String(callsToday)}
          delta={callsDelta}
          icon={<PhoneCall className="h-4 w-4" />}
        />
        <StatCard
          label="Ø Gesprächszeit"
          value={avgToday === null ? "—" : fmtDauer(avgToday) === "—" ? "0:00" : fmtDauer(avgToday)}
          delta={avgDelta}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Offene Rückrufe"
          value={openNotes === null ? "—" : String(openNotes)}
          icon={<StickyNote className="h-4 w-4" />}
        />
        <StatCard label="Zugewiesene Kunden" value={String(clients.length)} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Letzte Anrufe"
            action={
              <Link to="/mitarbeiter/live" className="text-xs font-medium text-primary hover:underline">
                Live-Ansicht →
              </Link>
            }
          >
            {recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Keine Anrufe.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recent.map((call) => {
                  const client = clients.find((c) => c.id === call.client_id);
                  const missed = call.status === "missed" || call.status === "verpasst";
                  const outgoing = call.direction === "out" || call.direction === "outgoing";
                  const nummer = outgoing ? call.to_number : call.from_number;
                  return (
                    <li key={call.id} className="flex items-center gap-3 py-3">
                      <ClientLogo logoUrl={client ? logoUrls[client.id] : undefined} name={client?.name ?? "?"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{call.caller_name || "Unbekannt"}</span>
                          <span className="font-mono text-xs text-muted-foreground">{nummer ?? ""}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client?.name ?? "—"} · {fmtRelative(call.started_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {missed ? (
                          <Badge variant="destructive" className="gap-1">
                            <PhoneMissed className="h-3 w-3" /> Verpasst
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            {outgoing ? <PhoneOutgoing className="h-3 w-3" /> : <PhoneIncoming className="h-3 w-3" />}
                            {call.duration ? fmtDauer(call.duration) : "—"}
                          </Badge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title="Meine Kunden"
          action={
            <Link to="/mitarbeiter/kunden" className="text-xs font-medium text-primary hover:underline">
              Alle →
            </Link>
          }
        >
          {clients.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Keine Kunden zugewiesen.</div>
          ) : (
            <ul className="space-y-2">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/mitarbeiter/kunden/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-border/60 hover:bg-surface/60"
                  >
                    <ClientLogo logoUrl={logoUrls[c.id]} name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.branche}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
