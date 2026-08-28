import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Search, RefreshCw, PhoneCall } from "lucide-react";

import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { INTERVIEW_STATUS_OPTIONS, RANKING_OPTIONS } from "@/lib/internal-recruitment";
import { useOutboundProfile } from "@/hooks/use-outbound-profile";

type Row = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  applications: {
    vorname: string;
    nachname: string;
    email: string | null;
    handynummer: string | null;
    anstellung: string | null;
    stelle: string | null;
    ranking: string | null;
  } | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function dayLabel(iso: string | null) {
  if (!iso) return "Ohne Datum";
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Heute";
  if (iso === tomorrow) return "Morgen";
  return formatDate(iso);
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "erfolgreich") return "default";
  if (s === "fehlgeschlagen") return "destructive";
  return "secondary";
}

const statusLabel = (v: string) =>
  INTERVIEW_STATUS_OPTIONS.find((s) => s.value === v)?.label ?? v;
const rankingLabel = (v: string | null) =>
  v ? (RANKING_OPTIONS.find((r) => r.value === v)?.label ?? v) : "—";

export default function InterneBewerbungsgespraeche() {
  const navigate = useNavigate();
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const { data: profile } = useOutboundProfile();
  const since = profile?.internalInterviewsSince ?? null;

  const query = useQuery({
    queryKey: ["intern-interviews", view, since],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("interview_appointments")
        .select(
          "id, appointment_date, appointment_time, status, applications(vorname, nachname, email, handynummer, anstellung, stelle, ranking)",
        );
      if (since) q = q.gte("booked_at", since);
      q =
        view === "upcoming"
          ? q
              .gte("appointment_date", today)
              .order("appointment_date", { ascending: true })
              .order("appointment_time", { ascending: true })
          : q
              .lt("appointment_date", today)
              .order("appointment_date", { ascending: false })
              .order("appointment_time", { ascending: false });
      const { data, error } = await q.limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Row[];
    },
  });

  // Realtime: neue oder geänderte Termine sofort übernehmen
  useEffect(() => {
    const channel = supabase
      .channel("intern-interviews")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interview_appointments" },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((r) => {
      const a = r.applications;
      return [a?.vorname, a?.nachname, a?.email, a?.handynummer, a?.stelle]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [query.data, search]);

  return (
    <>
      <PageHeader
        title="Bewerbungsgespräche"
        subtitle="Unsere eigenen Recruiting-Gespräche."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Calendar className="h-3 w-3" /> Intern
          </Badge>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={view === "upcoming" ? "default" : "outline"}
            onClick={() => setView("upcoming")}
          >
            Anstehend
          </Button>
          <Button
            size="sm"
            variant={view === "past" ? "default" : "outline"}
            onClick={() => setView("past")}
          >
            Vergangen
          </Button>

          <div className="relative ml-2 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name, E-Mail, Telefon…"
              className="h-9 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {query.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Lade Termine…</div>
        ) : query.isError ? (
          <div className="py-10 text-center text-sm text-destructive">
            {(query.error as Error).message}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <Calendar className="h-8 w-8 opacity-40" />
            Keine Termine in dieser Ansicht.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="grid grid-cols-[150px_1fr_140px_130px_120px_120px_120px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Termin</span>
              <span>Bewerber</span>
              <span>Telefon</span>
              <span>Anstellung</span>
              <span>Ranking</span>
              <span>Status</span>
              <span className="text-right">Aktion</span>
            </div>
            {rows.map((r, i) => {
              const a = r.applications;
              const showHeader =
                i === 0 || rows[i - 1].appointment_date !== r.appointment_date;
              return (
                <div key={r.id}>
                  {showHeader && (
                    <div className="flex items-center gap-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {dayLabel(r.appointment_date)}
                    </div>
                  )}
                  <div className="grid grid-cols-[150px_1fr_140px_130px_120px_120px_120px] items-center gap-4 rounded-lg px-2 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(r.appointment_date)}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.appointment_time?.slice(0, 5)} Uhr
                      </span>
                    </div>
                    <span className="truncate font-medium">
                      {a ? `${a.vorname} ${a.nachname}` : "—"}
                      {a?.stelle && (
                        <span className="ml-2 text-xs text-muted-foreground">{a.stelle}</span>
                      )}
                    </span>
                    <span className="truncate font-mono text-xs">{a?.handynummer ?? "—"}</span>
                    <span className="truncate capitalize text-muted-foreground">
                      {a?.anstellung ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {rankingLabel(a?.ranking ?? null)}
                    </span>
                    <span>
                      <Badge variant={statusVariant(r.status)} className="w-fit">
                        {statusLabel(r.status)}
                      </Badge>
                    </span>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          navigate(
                            `/mitarbeiter/erfassen?termin=${encodeURIComponent(r.id)}`,
                          )
                        }
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Anruf
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "Termin" : "Termine"}
        </div>
      </Panel>
    </>
  );
}
