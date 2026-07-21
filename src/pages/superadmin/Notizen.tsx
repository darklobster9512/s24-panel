import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type NoteRow = {
  id: string;
  client_id: string | null;
  employee_id: string | null;
  anrufer_name: string | null;
  anrufer_nummer: string | null;
  anliegen: string;
  kategorie: string | null;
  prioritaet: string | null;
  rueckruf_gewuenscht: boolean | null;
  rueckruf_zeit: string | null;
  created_at: string;
  clients: { id: string; company_name: string | null } | null;
  employees: { id: string; first_name: string | null; last_name: string | null } | null;
};

const KATEGORIEN = ["Rückruf", "Termin", "Info", "Beschwerde", "Weiterleitung"];

function formatTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}. ${hh}:${mi}`;
}

function empName(e: NoteRow["employees"]) {
  if (!e) return null;
  const n = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
  return n || null;
}

function prioVariant(p: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (p === "hoch") return "destructive";
  if (p === "niedrig") return "outline";
  return "secondary";
}

export default function Notizen() {
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("30d");
  const [clientFilter, setClientFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");
  const [katFilter, setKatFilter] = useState("all");
  const [prioFilter, setPrioFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("call_notes")
        .select(
          `id, client_id, employee_id, anrufer_name, anrufer_nummer, anliegen,
           kategorie, prioritaet, rueckruf_gewuenscht, rueckruf_zeit, created_at,
           clients:client_id ( id, company_name ),
           employees:employee_id ( id, first_name, last_name )`,
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) console.error("[Notizen] load failed:", error.message);
      setRows((data as unknown as NoteRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
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
      const n = empName(r.employees);
      if (r.employees?.id && n) map.set(r.employees.id, n);
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
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (clientFilter !== "all" && r.client_id !== clientFilter) return false;
      if (empFilter !== "all" && r.employee_id !== empFilter) return false;
      if (katFilter !== "all" && r.kategorie !== katFilter) return false;
      if (prioFilter !== "all" && r.prioritaet !== prioFilter) return false;
      if (q) {
        const hay = [
          r.anrufer_name,
          r.anrufer_nummer,
          r.anliegen,
          r.clients?.company_name,
          empName(r.employees),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, range, clientFilter, empFilter, katFilter, prioFilter]);

  const cols = "grid-cols-[120px_1.2fr_140px_180px_2fr_110px_100px_140px]";

  return (
    <>
      <PageHeader
        title="Notizen"
        subtitle="Alle Call-Notizen der Mitarbeiter, durchsuchbar."
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Anrufer, Anliegen, Kunde, Mitarbeiter…"
              className="h-9 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
              <SelectItem value="all">Alle</SelectItem>
            </SelectContent>
          </Select>

          <Select value={katFilter} onValueChange={setKatFilter}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Kategorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {KATEGORIEN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={prioFilter} onValueChange={setPrioFilter}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Priorität" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              <SelectItem value="hoch">Hoch</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="niedrig">Niedrig</SelectItem>
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
        </div>

        <div className="divide-y divide-border/60">
          <div className={`grid ${cols} gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground`}>
            <span>Zeit</span>
            <span>Kunde</span>
            <span>Mitarbeiter</span>
            <span>Anrufer</span>
            <span>Anliegen</span>
            <span>Kategorie</span>
            <span>Priorität</span>
            <span>Rückruf</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Lade Notizen…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Keine Notizen gefunden.
            </div>
          ) : (
            filtered.map((n) => {
              const emp = empName(n.employees) ?? "—";
              const kunde = n.clients?.company_name ?? "—";
              return (
                <div
                  key={n.id}
                  className={`grid ${cols} gap-4 py-3 text-sm items-center`}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(n.created_at)}
                  </span>
                  <span className="truncate font-medium">{kunde}</span>
                  <span className="truncate text-muted-foreground">{emp}</span>
                  <div className="min-w-0">
                    <div className="truncate">{n.anrufer_name ?? "—"}</div>
                    {n.anrufer_nummer && (
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {n.anrufer_nummer}
                      </div>
                    )}
                  </div>
                  <span className="truncate text-foreground/90" title={n.anliegen}>
                    {n.anliegen}
                  </span>
                  <span>
                    {n.kategorie ? (
                      <Badge variant="secondary" className="w-fit text-[10px]">
                        {n.kategorie}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  <span>
                    {n.prioritaet ? (
                      <Badge variant={prioVariant(n.prioritaet)} className="w-fit capitalize text-[10px]">
                        {n.prioritaet}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  <span className="text-xs">
                    {n.rueckruf_gewuenscht ? (
                      <Badge variant="outline" className="w-fit text-[10px]">
                        Ja{n.rueckruf_zeit ? ` · ${n.rueckruf_zeit}` : ""}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </>
  );
}
