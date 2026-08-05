import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Calendar, Search, Trash2, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ActivityLogCard from "@/components/superadmin/ActivityLogCard";
import { logActivity } from "@/lib/activityLog";

type Row = {
  id: string;
  application_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  booked_at: string;
  start_date: string | null;
  start_asap: boolean | null;
  applications: {
    vorname: string;
    nachname: string;
    email: string;
    handynummer: string;
    anstellung: string;
    stelle: string | null;
    ranking: string | null;
  } | null;
};

function startLabel(r: Row) {
  if (r.start_asap) return "Ab sofort";
  if (r.start_date) {
    return new Date(r.start_date + "T00:00:00").toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return "—";
}


const STATUS_OPTIONS = [
  { value: "neu", label: "Offen" },
  { value: "erfolgreich", label: "Erfolgreich" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
  { value: "abgesagt", label: "Abgesagt" },
];

const RANKING_OPTIONS = [
  { value: "sehr_gut", label: "Sehr gut" },
  { value: "gut", label: "Gut" },
  { value: "mittel", label: "Mittel" },
  { value: "schlecht", label: "Schlecht" },
];

const RANKING_CLASSES: Record<string, string> = {
  sehr_gut: "bg-primary/20 text-primary-foreground border-primary/40",
  gut: "bg-primary/10 text-foreground border-primary/30",
  mittel: "bg-muted text-foreground border-border",
  schlecht: "bg-destructive/15 text-destructive border-destructive/40",
};

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "erfolgreich") return "default";
  if (s === "fehlgeschlagen" || s === "abgesagt") return "destructive";
  return "secondary";
}

function statusLabelOf(v: string) {
  return STATUS_OPTIONS.find((s) => s.value === v)?.label ?? v;
}

function rankingLabelOf(v: string | null) {
  if (!v) return "Kein Ranking";
  return RANKING_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

function dayLabel(iso: string) {
  const today = new Date();
  const t = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
  if (iso === t) return "Heute";
  if (iso === tomorrow) return "Morgen";
  return formatDate(iso);
}

type View = "upcoming" | "past" | "all";

export default function Bewerbungsgespraeche() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("interview_appointments")
        .select(
          "id, application_id, appointment_date, appointment_time, status, notes, booked_at, start_date, start_asap, applications(vorname, nachname, email, handynummer, anstellung, stelle, ranking)",
        )
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("[Bewerbungsgespraeche] load failed:", error.message);
        toast.error("Termine konnten nicht geladen werden");
      }
      setRows((data as Row[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("superadmin_interview_appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interview_appointments" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const list = rows.filter((r) => {
      if (view === "upcoming" && r.appointment_date < today) return false;
      if (view === "past" && r.appointment_date >= today) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const a = r.applications;
        const hay = [a?.vorname, a?.nachname, a?.email, a?.handynummer].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Anstehend: nächster Termin oben. Vergangen: zuletzt gewesener oben.
    const dir = view === "past" ? -1 : 1;
    return list.sort(
      (a, b) =>
        dir *
        ((a.appointment_date + a.appointment_time).localeCompare(
          b.appointment_date + b.appointment_time,
        )),
    );
  }, [rows, search, view, statusFilter]);


  async function setStatus(id: string, status: string) {
    const { error } = await (supabase as any)
      .from("interview_appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Status-Update fehlgeschlagen");
      return;
    }
    const row = rows.find((r) => r.id === id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success("Status aktualisiert");
    void logActivity({
      action: "Status geändert",
      entityType: "interview_appointment",
      entityId: id,
      details: {
        subject: row?.applications
          ? `${row.applications.vorname} ${row.applications.nachname}`
          : undefined,
        from: statusLabelOf(row?.status ?? ""),
        to: statusLabelOf(status),
      },
    });
  }

  async function updateRanking(row: Row, value: string) {
    const ranking = value === "none" ? null : value;
    const { error } = await (supabase as any)
      .from("applications")
      .update({ ranking })
      .eq("id", row.application_id);
    if (error) {
      toast.error("Ranking konnte nicht gespeichert werden");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.application_id === row.application_id && r.applications
          ? { ...r, applications: { ...r.applications, ranking } }
          : r,
      ),
    );
    toast.success("Ranking aktualisiert");
    void logActivity({
      action: "Ranking geändert",
      entityType: "interview_appointment",
      entityId: row.id,
      details: {
        subject: row.applications
          ? `${row.applications.vorname} ${row.applications.nachname}`
          : undefined,
        from: rankingLabelOf(row.applications?.ranking ?? null),
        to: rankingLabelOf(ranking),
      },
    });
  }

  async function remove(row: Row) {
    if (!confirm("Termin wirklich löschen?")) return;
    const { error } = await (supabase as any)
      .from("interview_appointments")
      .delete()
      .eq("id", row.id);
    if (error) {
      toast.error("Löschen fehlgeschlagen");
      return;
    }
    // Reset application status so admin can resend link if needed
    await (supabase as any)
      .from("applications")
      .update({ status: "bewerbungsgespraech" })
      .eq("id", row.application_id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("Termin gelöscht");
    void logActivity({
      action: "Termin gelöscht",
      entityType: "interview_appointment",
      entityId: row.id,
      details: {
        subject: row.applications
          ? `${row.applications.vorname} ${row.applications.nachname}`
          : undefined,
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Bewerbungsgespräche"
        subtitle="Von Bewerbern gebuchte Termine — verwalte Status und Ergebnis."
      />

      <ActivityLogCard entityType="interview_appointment" />

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
          <Button
            size="sm"
            variant={view === "all" ? "default" : "outline"}
            onClick={() => setView("all")}
          >
            Alle
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Lade Termine…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <Calendar className="h-8 w-8 opacity-40" />
            Keine Termine in dieser Ansicht.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="grid grid-cols-[170px_1fr_1fr_140px_130px_160px_150px_130px_170px_120px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Termin</span>
              <span>Bewerber</span>
              <span>E-Mail</span>
              <span>Telefon</span>
              <span>Anstellung</span>
              <span>Stelle</span>
              <span>Ranking</span>
              <span>Startdatum</span>
              <span>Status</span>
              <span className="text-right">Aktionen</span>
            </div>
            {filtered.map((r, i) => {
              const a = r.applications;
              const showHeader =
                i === 0 || filtered[i - 1].appointment_date !== r.appointment_date;
              return (
                <div key={r.id}>
                  {showHeader && (
                    <div className="flex items-center gap-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {dayLabel(r.appointment_date)}
                    </div>
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/superadmin/bewerbungsgespraeche/${r.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/superadmin/bewerbungsgespraeche/${r.id}`);
                      }
                    }}
                    className="grid cursor-pointer grid-cols-[170px_1fr_1fr_140px_130px_150px_130px_170px_120px] items-center gap-4 rounded-lg px-2 py-3 text-sm transition-colors hover:bg-accent/60"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(r.appointment_date)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(r.appointment_time)} Uhr</span>
                    </div>
                    <span className="truncate font-medium">
                      {a?.vorname} {a?.nachname}
                    </span>
                    <span className="truncate text-muted-foreground">{a?.email}</span>
                    <span className="truncate font-mono text-xs">{a?.handynummer}</span>
                    <span className="truncate capitalize text-muted-foreground">{a?.anstellung}</span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={a?.ranking ?? "none"}
                        onValueChange={(v) => updateRanking(r, v)}
                      >
                        <SelectTrigger
                          className={`h-8 text-xs ${a?.ranking ? RANKING_CLASSES[a.ranking] ?? "" : ""}`}
                        >
                          <SelectValue placeholder="Kein Ranking" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein Ranking</SelectItem>
                          {RANKING_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span
                      className={`truncate text-xs ${r.start_asap || r.start_date ? "font-medium" : "text-muted-foreground"}`}
                    >
                      {startLabel(r)}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue asChild>
                            <Badge variant={statusVariant(r.status)} className="w-fit">
                              {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? r.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Erfolgreich"
                        onClick={() => setStatus(r.id, "erfolgreich")}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Fehlgeschlagen"
                        onClick={() => setStatus(r.id, "fehlgeschlagen")}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Löschen"
                        onClick={() => remove(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </Panel>
    </>
  );
}
