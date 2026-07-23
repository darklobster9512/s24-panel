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
import { Calendar, Search, Trash2, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  application_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  booked_at: string;
  applications: {
    vorname: string;
    nachname: string;
    email: string;
    handynummer: string;
    anstellung: string;
  } | null;
};

const STATUS_OPTIONS = [
  { value: "neu", label: "Offen" },
  { value: "erfolgreich", label: "Erfolgreich" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
  { value: "abgesagt", label: "Abgesagt" },
];

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "erfolgreich") return "default";
  if (s === "fehlgeschlagen" || s === "abgesagt") return "destructive";
  return "secondary";
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

type View = "upcoming" | "past" | "all";

export default function Bewerbungsgespraeche() {
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
          "id, application_id, appointment_date, appointment_time, status, notes, booked_at, applications(vorname, nachname, email, handynummer, anstellung)",
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
    return rows.filter((r) => {
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
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success("Status aktualisiert");
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
  }

  return (
    <>
      <PageHeader
        title="Bewerbungsgespräche"
        subtitle="Von Bewerbern gebuchte Termine — verwalte Status und Ergebnis."
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
            <div className="grid grid-cols-[170px_1fr_1fr_150px_140px_180px_120px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Termin</span>
              <span>Bewerber</span>
              <span>E-Mail</span>
              <span>Telefon</span>
              <span>Anstellung</span>
              <span>Status</span>
              <span className="text-right">Aktionen</span>
            </div>
            {filtered.map((r) => {
              const a = r.applications;
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[170px_1fr_1fr_150px_140px_180px_120px] items-center gap-4 py-3 text-sm"
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
                  <div>
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
                  <div className="flex justify-end gap-1">
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
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
