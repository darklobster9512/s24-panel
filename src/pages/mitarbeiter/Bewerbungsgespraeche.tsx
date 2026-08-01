import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Search,
  RefreshCw,
  PhoneCall,
  Link2,
  BellRing,
  Loader2,
} from "lucide-react";

import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  callerApi,
  listInterviews,
  listUpcomingInterviews,
  CallerApiError,
  type RecruitmentInterview,
} from "@/hooks/use-caller-api";


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

function statusVariant(s: string | null): "default" | "secondary" | "destructive" {
  const v = (s ?? "").toLowerCase();
  if (v.includes("erfolg") || v === "success" || v === "completed") return "default";
  if (v.includes("fehl") || v.includes("abges") || v === "failed") return "destructive";
  return "secondary";
}

function relTime(ts: number | null) {
  if (!ts) return "—";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "gerade eben";
  if (mins === 1) return "vor 1 Minute";
  return `vor ${mins} Minuten`;
}

export default function MitarbeiterBewerbungsgespraeche() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const knownIds = useRef<Set<string> | null>(null);
  const errorCount = useRef(0);

  useEffect(() => setPage(0), [view, debounced]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const meta = useQuery({
    queryKey: ["caller-meta"],
    staleTime: 30 * 60_000,
    queryFn: () => callerApi<any>("meta"),
  });

  const query = useQuery({
    queryKey: ["caller-interviews", view, page, debounced],
    // Alle 5 Minuten automatisch neue Termine holen
    refetchInterval: () => (errorCount.current >= 3 ? false : 5 * 60_000),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
    queryFn: () =>
      view === "upcoming"
        ? listUpcomingInterviews(page, debounced)
        : listInterviews("past", page, debounced),
  });

  // Tickt für die "zuletzt aktualisiert"-Anzeige
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Fehlerzähler + Rate-Limit-Hinweis
  useEffect(() => {
    if (query.isError) {
      errorCount.current += 1;
      const err = query.error as CallerApiError;
      if (err?.status === 429) {
        toast.error("Rate-Limit erreicht — automatische Aktualisierung pausiert.");
      }
    } else if (query.isSuccess) {
      errorCount.current = 0;
    }
  }, [query.isError, query.isSuccess, query.error]);

  // Toast bei neuen Terminen
  useEffect(() => {
    if (!query.data) return;
    const ids = new Set<string>(query.data.items.map((r) => r.id));
    if (knownIds.current && page === 0 && view === "upcoming") {
      const fresh = [...ids].filter((id) => !knownIds.current!.has(id));
      if (fresh.length > 0) {
        toast.success(
          fresh.length === 1 ? "1 neuer Termin" : `${fresh.length} neue Termine`,
        );
      }
    }
    knownIds.current = ids;
  }, [query.data, page, view]);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const total = query.data?.total ?? 0;
  const pageSize = query.data?.pageSize ?? 25;
  const hasNext = (page + 1) * pageSize < total;


  const brandLabel =
    (meta.data as any)?.label ??
    (meta.data as any)?.brand ??
    (meta.data as any)?.company_name ??
    null;

  async function runAction(
    row: RecruitmentInterview,
    action: "send_panel_link" | "send_reminder",
  ) {
    setBusyId(row.id + action);
    try {
      await callerApi(action, { interview_id: row.id });
      toast.success(
        action === "send_panel_link" ? "Panel-Link gesendet" : "Erinnerung gesendet",
      );
      qc.invalidateQueries({ queryKey: ["caller-interviews"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const lastUpdated = query.dataUpdatedAt || null;

  return (
    <>
      <PageHeader
        title="Bewerbungsgespräche"
        subtitle={
          brandLabel
            ? `Outbound Recruitment — ${brandLabel}`
            : "Deine geplanten Recruiting-Gespräche."
        }
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Calendar className="h-3 w-3" /> Outbound
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

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>Zuletzt aktualisiert {relTime(lastUpdated)}</span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                errorCount.current = 0;
                query.refetch();
              }}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`}
              />
              Aktualisieren
            </Button>
          </div>
        </div>

        {query.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Lade Termine…
          </div>
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
            <div className="grid grid-cols-[150px_1fr_1fr_140px_130px_130px_190px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Termin</span>
              <span>Bewerber</span>
              <span>E-Mail</span>
              <span>Telefon</span>
              <span>Anstellung</span>
              <span>Status</span>
              <span className="text-right">Aktionen</span>
            </div>
            {rows.map((r, i) => {
              const showHeader = i === 0 || rows[i - 1].date !== r.date;
              return (
                <div key={r.id}>
                  {showHeader && (
                    <div className="flex items-center gap-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {dayLabel(r.date)}
                    </div>
                  )}
                  <div className="grid grid-cols-[150px_1fr_1fr_140px_130px_130px_190px] items-center gap-4 rounded-lg px-2 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(r.date)}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.time ? `${r.time} Uhr` : "—"}
                      </span>
                    </div>
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="truncate text-muted-foreground">{r.email ?? "—"}</span>
                    <span className="truncate font-mono text-xs">{r.phone ?? "—"}</span>
                    <span className="truncate capitalize text-muted-foreground">
                      {r.employment ?? "—"}
                    </span>
                    <span>
                      <Badge variant={statusVariant(r.status)} className="w-fit">
                        {r.status ?? "offen"}
                      </Badge>
                    </span>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Panel-Link senden"
                        disabled={busyId === r.id + "send_panel_link"}
                        onClick={() => runAction(r, "send_panel_link")}
                      >
                        {busyId === r.id + "send_panel_link" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Erinnerung senden"
                        disabled={busyId === r.id + "send_reminder"}
                        onClick={() => runAction(r, "send_reminder")}
                      >
                        {busyId === r.id + "send_reminder" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BellRing className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          navigate(`/mitarbeiter/erfassen?interview=${encodeURIComponent(r.id)}`)
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

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Seite {page + 1} · {total} {total === 1 ? "Termin" : "Termine"}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0 || query.isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Zurück
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasNext || query.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Weiter
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
