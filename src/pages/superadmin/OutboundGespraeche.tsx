import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Search, RefreshCw, PhoneOutgoing } from "lucide-react";

import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { listInterviews, listUpcomingInterviews } from "@/hooks/use-caller-api";

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

type CallerRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  caller_api_key: string | null;
};

export default function SuperadminOutboundGespraeche() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => setPage(0), [view, debounced, employeeId]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const callersQuery = useQuery({
    queryKey: ["outbound-callers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employees")
        .select("id, first_name, last_name, caller_api_key")
        .eq("outbound_recruitment", true)
        .eq("is_draft", false)
        .order("first_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CallerRow[];
    },
  });

  const callers = useMemo(() => callersQuery.data ?? [], [callersQuery.data]);

  useEffect(() => {
    if (!employeeId && callers.length > 0) setEmployeeId(callers[0].id);
  }, [callers, employeeId]);

  const selected = callers.find((c) => c.id === employeeId) ?? null;
  const hasKey = Boolean(selected?.caller_api_key);

  const query = useQuery({
    queryKey: ["superadmin-caller-interviews", employeeId, view, page, debounced],
    enabled: Boolean(employeeId) && hasKey,
    staleTime: 60_000,
    queryFn: () =>
      view === "upcoming"
        ? listUpcomingInterviews(page, debounced, employeeId)
        : listInterviews("past", page, debounced, employeeId),
  });

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageSize = query.data?.pageSize ?? 25;
  const hasNext = (page + 1) * pageSize < total;

  const callerName = (c: CallerRow) =>
    [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Unbenannt";

  return (
    <>
      <PageHeader
        title="Outbound-Gespräche"
        subtitle="Bewerbungsgespräche der Outbound-Caller — nur Ansicht."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <PhoneOutgoing className="h-3 w-3" /> Outbound
          </Badge>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="h-9 w-[240px]">
              <SelectValue placeholder="Caller auswählen" />
            </SelectTrigger>
            <SelectContent>
              {callers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {callerName(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            disabled={query.isFetching || !employeeId || !hasKey}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {callersQuery.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Lade Caller…</div>
        ) : callers.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Kein Mitarbeiter mit aktiviertem Outbound-Recruitment vorhanden.
          </div>
        ) : !hasKey ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Für diesen Mitarbeiter ist kein Caller-API-Key hinterlegt.
          </div>
        ) : query.isLoading ? (
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
            <div className="grid grid-cols-[150px_1fr_1fr_140px_130px_130px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Termin</span>
              <span>Bewerber</span>
              <span>E-Mail</span>
              <span>Telefon</span>
              <span>Anstellung</span>
              <span>Status</span>
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
                  <div className="grid grid-cols-[150px_1fr_1fr_140px_130px_130px] items-center gap-4 rounded-lg px-2 py-3 text-sm">
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
                  </div>
                  {r.notes.length > 0 && (
                    <div className="space-y-1 px-2 pb-3 text-xs text-muted-foreground">
                      {r.notes.map((n, idx) => (
                        <div key={idx} className="truncate">
                          <span className="font-medium">{n.status || "Notiz"}:</span> {n.text}
                        </div>
                      ))}
                    </div>
                  )}
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
