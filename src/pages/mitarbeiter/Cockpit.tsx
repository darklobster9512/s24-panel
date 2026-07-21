import { Link } from "react-router-dom";
import { useSuspenseQuery } from "@tanstack/react-query";
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

  const { data: profile } = useSuspenseQuery({
    queryKey: ["mitarbeiter-profile", user?.id],
    queryFn: async () => {
      if (!user) return { firstName: "", employeeId: null as string | null };
      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      let firstName = emp?.first_name ?? "";
      if (!firstName) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (prof?.full_name) firstName = prof.full_name.split(" ")[0];
        else firstName = user.email?.split("@")[0] ?? "";
      }
      return { firstName, employeeId: emp?.id ?? null };
    },
  });

  const { data: stats } = useSuspenseQuery({
    queryKey: ["mitarbeiter-cockpit-stats", assignedIds.join(",")],
    queryFn: async () => {
      if (assignedIds.length === 0) {
        return { callsToday: 0, callsYesterday: 0, avgToday: 0, avgYesterday: 0, recent: [] as RecentCall[] };
      }
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

      const avg = (rows: any[] | null | undefined) => {
        if (!rows || rows.length === 0) return 0;
        const durations = rows
          .map((r) => durationOf(r.started_at, r.ended_at))
          .filter((d): d is number => d !== null && d > 0);
        if (durations.length === 0) return 0;
        return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      };

      return {
        callsToday: todayRows?.length ?? 0,
        callsYesterday: yRows?.length ?? 0,
        avgToday: avg(todayRows),
        avgYesterday: avg(yRows),
        recent: (recentRows ?? []).map((r) => ({
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
      };
    },
  });

  const { data: openNotes } = useSuspenseQuery({
    queryKey: ["mitarbeiter-open-notes", profile.employeeId],
    queryFn: async () => {
      if (!profile.employeeId) return 0;
      const { count } = await supabase
        .from("call_notes")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", profile.employeeId)
        .eq("rueckruf_gewuenscht", true);
      return count ?? 0;
    },
  });

  const { firstName } = profile;
  const { callsToday, callsYesterday, avgToday, avgYesterday, recent } = stats;

  const callsDelta = `${callsToday - callsYesterday >= 0 ? "+" : ""}${callsToday - callsYesterday} vs. gestern`;

  const avgDelta = (() => {
    if (avgYesterday === 0) return undefined;
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
          value={String(callsToday)}
          delta={callsDelta}
          icon={<PhoneCall className="h-4 w-4" />}
        />
        <StatCard
          label="Ø Gesprächszeit"
          value={fmtDauer(avgToday) === "—" ? "0:00" : fmtDauer(avgToday)}
          delta={avgDelta}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Offene Rückrufe"
          value={String(openNotes)}
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
