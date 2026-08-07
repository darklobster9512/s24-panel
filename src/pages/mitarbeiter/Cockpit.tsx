import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  PhoneCall,
  Clock,
  StickyNote,
  Users,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Timer,
} from "lucide-react";
import { PageHeader, Panel, StatCard, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative, fmtDauer } from "@/lib/mitarbeiter-mock";
import {
  startOfLocalDayISO,
  durationBetween,
  avgPositive,
  sumPositive,
  fmtGesamt,
} from "@/lib/mitarbeiter-stats";

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

interface RecentNote {
  id: string;
  client_id: string | null;
  anrufer_name: string | null;
  anrufer_nummer: string | null;
  kategorie: string | null;
  dauer_sekunden: number;
  created_at: string;
}

export default function Cockpit() {
  const { clients, logoUrls, ids: assignedIds } = useAssignedClients();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useSuspenseQuery({
    queryKey: ["mitarbeiter-profile", user?.id],
    queryFn: async () => {
      if (!user) return { firstName: "", employeeId: null as string | null, outbound: false };
      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name, last_name, outbound_recruitment")
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
      return {
        firstName,
        employeeId: emp?.id ?? null,
        outbound: !!emp?.outbound_recruitment,
      };
    },
  });

  const employeeId = profile.employeeId;

  /** Inbound-Kennzahlen aus sipgate_calls (zugewiesene Kunden). */
  const { data: callStats } = useSuspenseQuery({
    queryKey: ["mitarbeiter-cockpit-stats", assignedIds.join(",")],
    queryFn: async () => {
      if (assignedIds.length === 0) {
        return { callsToday: 0, callsYesterday: 0, avgToday: 0, avgYesterday: 0, recent: [] as RecentCall[] };
      }
      const todayStart = startOfLocalDayISO(0);
      const yStart = startOfLocalDayISO(-1);

      const [{ data: todayRows }, { data: yRows }, { data: recentRows }] = await Promise.all([
        supabase
          .from("sipgate_calls")
          .select("status, started_at, answered_at, ended_at")
          .in("client_id", assignedIds)
          .gte("started_at", todayStart),
        supabase
          .from("sipgate_calls")
          .select("status, started_at, answered_at, ended_at")
          .in("client_id", assignedIds)
          .gte("started_at", yStart)
          .lt("started_at", todayStart),
        supabase
          .from("sipgate_calls")
          .select(
            "id, client_id, caller_name, from_number, to_number, direction, status, started_at, answered_at, ended_at",
          )
          .in("client_id", assignedIds)
          .order("started_at", { ascending: false })
          .limit(6),
      ]);

      const avg = (rows: any[] | null | undefined) =>
        avgPositive((rows ?? []).map((r) => durationBetween(r.answered_at, r.ended_at)));

      return {
        callsToday: todayRows?.length ?? 0,
        callsYesterday: yRows?.length ?? 0,
        avgToday: avg(todayRows),
        avgYesterday: avg(yRows),
        recent: (recentRows ?? []).map((r: any) => ({
          id: r.id,
          client_id: r.client_id,
          caller_name: r.caller_name,
          from_number: r.from_number,
          to_number: r.to_number,
          direction: r.direction,
          status: r.status,
          started_at: r.started_at,
          ended_at: r.ended_at,
          duration: durationBetween(r.answered_at, r.ended_at) || null,
        })),
      };
    },
  });

  /** Outbound-Kennzahlen aus den selbst erfassten Gesprächen (call_notes). */
  const { data: noteStats } = useSuspenseQuery({
    queryKey: ["mitarbeiter-cockpit-notes", employeeId],
    queryFn: async () => {
      const empty = {
        today: 0,
        yesterday: 0,
        avgToday: 0,
        totalToday: 0,
        openCallbacks: 0,
        recent: [] as RecentNote[],
        totalCount: 0,
      };
      if (!employeeId) return empty;

      const todayStart = startOfLocalDayISO(0);
      const yStart = startOfLocalDayISO(-1);

      const [todayRes, yRes, recentRes, callbackRes] = await Promise.all([
        supabase
          .from("call_notes")
          .select("id, dauer_sekunden")
          .eq("employee_id", employeeId)
          .gte("created_at", todayStart),
        supabase
          .from("call_notes")
          .select("id")
          .eq("employee_id", employeeId)
          .gte("created_at", yStart)
          .lt("created_at", todayStart),
        supabase
          .from("call_notes")
          .select("id, client_id, anrufer_name, anrufer_nummer, kategorie, dauer_sekunden, created_at")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("call_notes")
          .select("id", { count: "exact", head: true })
          .eq("employee_id", employeeId)
          .eq("rueckruf_gewuenscht", true),
      ]);

      const durs = (todayRes.data ?? []).map((n: any) => n.dauer_sekunden ?? 0);

      return {
        today: todayRes.data?.length ?? 0,
        yesterday: yRes.data?.length ?? 0,
        avgToday: avgPositive(durs),
        totalToday: sumPositive(durs),
        openCallbacks: callbackRes.count ?? 0,
        recent: (recentRes.data ?? []) as RecentNote[],
        totalCount: recentRes.data?.length ?? 0,
      };
    },
  });

  // Live-Aktualisierung, sobald ein Gespräch erfasst wird
  useEffect(() => {
    if (!employeeId) return;
    const channel = supabase
      .channel(`cockpit-call-notes-${employeeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_notes", filter: `employee_id=eq.${employeeId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["mitarbeiter-cockpit-notes", employeeId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, qc]);

  const { firstName } = profile;
  // Outbound-Ansicht: explizit markierte Recruiter oder Mitarbeiter ohne Inbound-Anrufe,
  // die aber eigene Gespräche erfasst haben.
  const isOutbound =
    profile.outbound || (callStats.recent.length === 0 && noteStats.recent.length > 0);

  const deltaLabel = (a: number, b: number) => `${a - b >= 0 ? "+" : ""}${a - b} vs. gestern`;

  const avgDelta = (() => {
    if (callStats.avgYesterday === 0) return undefined;
    const diff = callStats.avgToday - callStats.avgYesterday;
    return `${diff >= 0 ? "+" : "-"}${fmtDauer(Math.abs(diff))} vs. gestern`;
  })();

  return (
    <>
      <PageHeader
        title={`Willkommen${firstName ? `, ${firstName}` : ""}`}
        subtitle={
          isOutbound
            ? "Übersicht über deine Gespräche und offenen Aufgaben."
            : "Übersicht über deine Kunden, Anrufe und offenen Aufgaben."
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {isOutbound ? (
          <>
            <StatCard
              label="Gespräche heute"
              value={String(noteStats.today)}
              delta={deltaLabel(noteStats.today, noteStats.yesterday)}
              icon={<PhoneCall className="h-4 w-4" />}
            />
            <StatCard
              label="Ø Gesprächszeit"
              value={noteStats.avgToday ? fmtDauer(noteStats.avgToday) : "0:00"}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="Gesamtzeit heute"
              value={fmtGesamt(noteStats.totalToday)}
              icon={<Timer className="h-4 w-4" />}
            />
            <StatCard
              label="Offene Rückrufe"
              value={String(noteStats.openCallbacks)}
              icon={<StickyNote className="h-4 w-4" />}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Anrufe heute"
              value={String(callStats.callsToday)}
              delta={deltaLabel(callStats.callsToday, callStats.callsYesterday)}
              icon={<PhoneCall className="h-4 w-4" />}
            />
            <StatCard
              label="Ø Gesprächszeit"
              value={callStats.avgToday ? fmtDauer(callStats.avgToday) : "0:00"}
              delta={avgDelta}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="Offene Rückrufe"
              value={String(noteStats.openCallbacks)}
              icon={<StickyNote className="h-4 w-4" />}
            />
            <StatCard
              label="Zugewiesene Kunden"
              value={String(clients.length)}
              icon={<Users className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isOutbound ? (
            <Panel
              title="Letzte Gespräche"
              action={
                <Link to="/mitarbeiter/notizen" className="text-xs font-medium text-primary hover:underline">
                  Alle Notizen →
                </Link>
              }
            >
              {noteStats.recent.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Noch keine Gespräche erfasst.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {noteStats.recent.map((note) => {
                    const client = clients.find((c) => c.id === note.client_id);
                    return (
                      <li key={note.id} className="flex items-center gap-3 py-3">
                        <ClientLogo
                          logoUrl={client ? logoUrls[client.id] : undefined}
                          name={client?.name ?? "?"}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{note.anrufer_name || "Unbekannt"}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {note.anrufer_nummer ?? ""}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {client?.name ?? "—"} · {fmtRelative(note.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {note.kategorie && (
                            <Badge variant="outline" className="hidden sm:inline-flex">
                              {note.kategorie}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="gap-1">
                            <PhoneOutgoing className="h-3 w-3" />
                            {note.dauer_sekunden > 0 ? fmtDauer(note.dauer_sekunden) : "—"}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ) : (
            <Panel
              title="Letzte Anrufe"
              action={
                <Link to="/mitarbeiter/live" className="text-xs font-medium text-primary hover:underline">
                  Live-Ansicht →
                </Link>
              }
            >
              {callStats.recent.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Keine Anrufe.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {callStats.recent.map((call) => {
                    const client = clients.find((c) => c.id === call.client_id);
                    const missed = call.status === "missed" || call.status === "verpasst";
                    const outgoing = call.direction === "out" || call.direction === "outgoing";
                    const nummer = outgoing ? call.to_number : call.from_number;
                    return (
                      <li key={call.id} className="flex items-center gap-3 py-3">
                        <ClientLogo
                          logoUrl={client ? logoUrls[client.id] : undefined}
                          name={client?.name ?? "?"}
                          size="sm"
                        />
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
                              {outgoing ? (
                                <PhoneOutgoing className="h-3 w-3" />
                              ) : (
                                <PhoneIncoming className="h-3 w-3" />
                              )}
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
          )}
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
          {isOutbound && (
            <Link
              to="/mitarbeiter/bewerbungsgespraeche"
              className="mt-3 block text-xs font-medium text-primary hover:underline"
            >
              Bewerbungsgespräche öffnen →
            </Link>
          )}
        </Panel>
      </div>
    </>
  );
}
