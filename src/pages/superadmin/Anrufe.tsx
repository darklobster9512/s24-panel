import { useEffect, useMemo, useState } from "react";
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
import {
  Search,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CallRow = {
  id: string;
  direction: "in" | "out";
  from_number: string | null;
  to_number: string | null;
  client_id: string | null;
  answered_by_employee_id: string | null;
  handled_by_employee_id: string | null;
  status: "ringing" | "answered" | "missed" | "ended";
  caller_name: string | null;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  clients: { id: string; company_name: string | null } | null;
  answered_by: { id: string; first_name: string | null; last_name: string | null } | null;
  handled_by: { id: string; first_name: string | null; last_name: string | null } | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}. ${hh}:${mi}`;
}

function formatDuration(row: CallRow) {
  if (!row.answered_at) return "0:00";
  const end = row.ended_at ? new Date(row.ended_at).getTime() : Date.now();
  const start = new Date(row.answered_at).getTime();
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function statusLabel(s: CallRow["status"]) {
  return {
    ringing: "klingelt",
    answered: "im Gespräch",
    ended: "beendet",
    missed: "verpasst",
  }[s];
}

function statusVariant(s: CallRow["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (s === "missed") return "destructive";
  if (s === "ringing" || s === "answered") return "secondary";
  return "default";
}

function DirIcon({ row }: { row: CallRow }) {
  if (row.status === "missed") return <PhoneMissed className="h-4 w-4 text-destructive" />;
  if (row.direction === "out") return <PhoneOutgoing className="h-4 w-4 text-ink" />;
  return <PhoneIncoming className="h-4 w-4 text-primary" />;
}

function empName(e: CallRow["answered_by"]) {
  if (!e) return null;
  const n = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
  return n || null;
}

export default function Anrufe() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("30d");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [empFilter, setEmpFilter] = useState<string>("all");
  const [dirFilter, setDirFilter] = useState<"all" | "in" | "out" | "missed">("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("sipgate_calls")
        .select(
          `id, direction, from_number, to_number, client_id,
           answered_by_employee_id, handled_by_employee_id, status,
           caller_name, started_at, answered_at, ended_at,
           clients:client_id ( id, company_name ),
           answered_by:answered_by_employee_id ( id, first_name, last_name ),
           handled_by:handled_by_employee_id ( id, first_name, last_name )`,
        )
        .order("started_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) console.error("[Anrufe] load failed:", error.message);
      setRows((data as unknown as CallRow[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("superadmin_calls_log")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sipgate_calls" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.clients?.id && r.clients.company_name)
        map.set(r.clients.id, r.clients.company_name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      const e = r.answered_by ?? r.handled_by;
      const n = empName(e);
      if (e?.id && n) map.set(e.id, n);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "today"
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : range === "7d"
          ? now - 7 * 24 * 3600 * 1000
          : range === "30d"
            ? now - 30 * 24 * 3600 * 1000
            : 0;
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (cutoff && new Date(r.started_at).getTime() < cutoff) return false;
      if (clientFilter !== "all" && r.client_id !== clientFilter) return false;
      if (empFilter !== "all") {
        const eid = r.answered_by_employee_id ?? r.handled_by_employee_id;
        if (eid !== empFilter) return false;
      }
      if (dirFilter !== "all") {
        if (dirFilter === "missed" && r.status !== "missed") return false;
        if (dirFilter === "in" && (r.direction !== "in" || r.status === "missed"))
          return false;
        if (dirFilter === "out" && r.direction !== "out") return false;
      }
      if (q) {
        const hay = [
          r.from_number,
          r.to_number,
          r.caller_name,
          r.clients?.company_name,
          empName(r.answered_by),
          empName(r.handled_by),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, range, clientFilter, empFilter, dirFilter]);

  function exportCSV() {
    const header = [
      "Zeit",
      "Richtung",
      "Status",
      "Von",
      "An",
      "Kunde",
      "Mitarbeiter",
      "Dauer",
    ];
    const lines = filtered.map((r) => {
      const emp = empName(r.answered_by) ?? empName(r.handled_by) ?? "";
      return [
        formatTime(r.started_at),
        r.direction,
        statusLabel(r.status),
        r.from_number ?? "",
        r.to_number ?? "",
        r.clients?.company_name ?? "",
        emp,
        formatDuration(r),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anrufe-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Anrufe"
        subtitle="Globales Anruf-Log über alle Kunden und Mitarbeiter."
        actions={
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nummer, Kunde, Mitarbeiter…"
              className="h-9 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
              <SelectItem value="all">Alle</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Kunde" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kunden</SelectItem>
              {clientOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Mitarbeiter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Mitarbeiter</SelectItem>
              {employeeOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dirFilter} onValueChange={(v) => setDirFilter(v as typeof dirFilter)}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Richtungen</SelectItem>
              <SelectItem value="in">Eingehend</SelectItem>
              <SelectItem value="out">Ausgehend</SelectItem>
              <SelectItem value="missed">Verpasst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[130px_40px_1fr_160px_80px_120px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Zeit</span>
            <span></span>
            <span>Kunde / Nummer</span>
            <span>Mitarbeiter</span>
            <span>Dauer</span>
            <span>Status</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Lade Anrufe…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Keine Anrufe gefunden.
            </div>
          ) : (
            filtered.map((c) => {
              const emp = empName(c.answered_by) ?? empName(c.handled_by) ?? "—";
              const kunde =
                c.clients?.company_name ??
                (c.direction === "in" ? c.from_number : c.to_number) ??
                "— Unbekannt —";
              const sub =
                c.clients?.company_name
                  ? c.direction === "in"
                    ? c.from_number
                    : c.to_number
                  : c.caller_name;
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-[130px_40px_1fr_160px_80px_120px] gap-4 py-3 text-sm items-center"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(c.started_at)}
                  </span>
                  <DirIcon row={c} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{kunde}</div>
                    {sub && (
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {sub}
                      </div>
                    )}
                  </div>
                  <span className="truncate text-muted-foreground">{emp}</span>
                  <span className="font-mono">{formatDuration(c)}</span>
                  <Badge variant={statusVariant(c.status)} className="w-fit capitalize">
                    {statusLabel(c.status)}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </>
  );
}
