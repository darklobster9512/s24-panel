import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Search, Trash2, Plus, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  application_id: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  telefon: string | null;
  stelle: string | null;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  start_date: string | null;
  status: string;
};

type ApplicationHit = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  handynummer: string | null;
  stelle: string | null;
  anstellung: string | null;
};

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  personal_email: string | null;
  onboarding_enabled: boolean;
};

type ContractRow = { employee_id: string; status: string };

type StatusInfo = {
  hasAccount: boolean;
  contract: "none" | "pending" | "completed";
  onboarding: boolean;
};

function norm(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}

function StatusCell({
  state,
  title,
}: {
  state: "ok" | "pending" | "no";
  title: string;
}) {
  const cls =
    state === "ok"
      ? "text-emerald-500"
      : state === "pending"
        ? "text-amber-500"
        : "text-destructive";
  return (
    <span className="flex justify-center" title={title}>
      {state === "no" ? (
        <X className={`h-4 w-4 ${cls}`} />
      ) : (
        <Check className={`h-4 w-4 ${cls}`} />
      )}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "offen", label: "Offen" },
  { value: "erledigt", label: "Erledigt" },
  { value: "abgesagt", label: "Abgesagt" },
];

function statusVariant(s: string): "default" | "secondary" | "destructive" {
  if (s === "erledigt") return "default";
  if (s === "abgesagt") return "destructive";
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

function dayLabel(iso: string) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Heute";
  if (iso === tomorrow) return "Morgen";
  return formatDate(iso);
}

type View = "upcoming" | "past" | "all";

export default function OnboardingTermine() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [hits, setHits] = useState<ApplicationHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ApplicationHit | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startAsap, setStartAsap] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("onboarding_appointments")
      .select(
        "id, application_id, vorname, nachname, email, telefon, stelle, appointment_date, appointment_time, notes, start_date, status",
      )
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });
    if (error) {
      console.error("[OnboardingTermine] load failed:", error.message);
      toast.error("Termine konnten nicht geladen werden");
    }
    setRows((data as Row[]) ?? []);

    const [empRes, conRes] = await Promise.all([
      (supabase as any)
        .from("employees")
        .select("id, first_name, last_name, personal_email, onboarding_enabled"),
      (supabase as any).from("employee_contracts").select("employee_id, status"),
    ]);
    setEmployees((empRes.data as EmployeeRow[]) ?? []);
    setContracts((conRes.data as ContractRow[]) ?? []);
    setLoading(false);
  }

  const statusByRow = useMemo(() => {
    const map = new Map<string, StatusInfo>();
    const contractsByEmp = new Map<string, string[]>();
    for (const c of contracts) {
      const list = contractsByEmp.get(c.employee_id) ?? [];
      list.push(c.status);
      contractsByEmp.set(c.employee_id, list);
    }
    for (const r of rows) {
      const emp =
        employees.find(
          (e) =>
            norm(e.first_name) === norm(r.vorname) &&
            norm(e.last_name) === norm(r.nachname) &&
            norm(r.vorname) !== "" &&
            norm(r.nachname) !== "",
        ) ??
        employees.find(
          (e) => norm(e.personal_email) !== "" && norm(e.personal_email) === norm(r.email),
        );
      if (!emp) {
        map.set(r.id, { hasAccount: false, contract: "none", onboarding: false });
        continue;
      }
      const list = contractsByEmp.get(emp.id) ?? [];
      const contract: StatusInfo["contract"] = list.includes("completed")
        ? "completed"
        : list.length > 0
          ? "pending"
          : "none";
      map.set(r.id, {
        hasAccount: true,
        contract,
        onboarding: !!emp.onboarding_enabled,
      });
    }
    return map;
  }, [rows, employees, contracts]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("superadmin_onboarding_appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "onboarding_appointments" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bewerbungssuche im Dialog
  useEffect(() => {
    const q = appSearch.trim();
    if (!open) return;
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      const { data, error } = await (supabase as any)
        .from("applications")
        .select("id, vorname, nachname, email, handynummer, stelle, anstellung")
        .or(
          [
            `vorname.ilike.%${q}%`,
            `nachname.ilike.%${q}%`,
            `email.ilike.%${q}%`,
            `handynummer.ilike.%${q}%`,
          ].join(","),
        )
        .order("created_at", { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (error) console.error("[OnboardingTermine] search failed:", error.message);
      setHits((data as ApplicationHit[]) ?? []);
      setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [appSearch, open]);

  // Startdatum & Notiz aus dem Bewerbungsgespräch vorbefüllen
  useEffect(() => {
    if (!selected) {
      setStartAsap(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("interview_appointments")
        .select("start_date, start_asap, notes")
        .eq("application_id", selected.id)
        .maybeSingle();
      if (cancelled || error || !data) return;
      setStartAsap(!!data.start_asap);
      if (data.start_date) setStartDate(data.start_date);
      if (data.notes) setNotes((prev) => (prev.trim() ? prev : data.notes));
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);



  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const list = rows.filter((r) => {
      if (view === "upcoming" && r.appointment_date < today) return false;
      if (view === "past" && r.appointment_date >= today) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay = [r.vorname, r.nachname, r.email, r.telefon, r.stelle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = view === "past" ? -1 : 1;
    return list.sort(
      (a, b) =>
        dir *
        (a.appointment_date + a.appointment_time).localeCompare(
          b.appointment_date + b.appointment_time,
        ),
    );
  }, [rows, search, view, statusFilter]);

  function resetDialog() {
    setAppSearch("");
    setHits([]);
    setSelected(null);
    setDate("");
    setTime("");
    setNotes("");
    setStartDate("");
    setStartAsap(false);
  }

  async function save() {
    if (!selected) return toast.error("Bitte eine Bewerbung auswählen.");
    if (!date || !time) return toast.error("Bitte Datum und Uhrzeit angeben.");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("onboarding_appointments").insert({
      application_id: selected.id,
      vorname: selected.vorname,
      nachname: selected.nachname,
      email: selected.email,
      telefon: selected.handynummer,
      stelle: selected.stelle ?? selected.anstellung ?? null,
      appointment_date: date,
      appointment_time: time,
      notes: notes.trim() || null,
      start_date: startDate || null,
      created_by: userRes?.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen: " + error.message);
      return;
    }
    toast.success("Onboarding-Termin gespeichert");
    setOpen(false);
    resetDialog();
    load();
  }

  async function setStatus(id: string, status: string) {
    const { error } = await (supabase as any)
      .from("onboarding_appointments")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error("Status-Update fehlgeschlagen");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success("Status aktualisiert");
  }

  async function remove(row: Row) {
    if (!confirm("Onboarding-Termin wirklich löschen?")) return;
    const { error } = await (supabase as any)
      .from("onboarding_appointments")
      .delete()
      .eq("id", row.id);
    if (error) return toast.error("Löschen fehlgeschlagen");
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("Termin gelöscht");
  }

  return (
    <>
      <PageHeader
        title="Onboarding-Termine"
        subtitle="Onboarding-Termine für Bewerber planen, Arbeitstage und Stunden festhalten."
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
            <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Onboarding-Termin
          </Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Lade Termine…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <CalendarClock className="h-8 w-8 opacity-40" />
            Keine Onboarding-Termine in dieser Ansicht.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="grid grid-cols-[170px_1fr_1fr_140px_150px_1fr_150px_60px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Termin</span>
              <span>Bewerber</span>
              <span>E-Mail</span>
              <span>Telefon</span>
              <span>Stelle</span>
              <span>Notiz</span>
              <span>Status</span>
              <span className="text-right">Aktion</span>
            </div>
            {filtered.map((r, i) => {
              const showHeader =
                i === 0 || filtered[i - 1].appointment_date !== r.appointment_date;
              return (
                <div key={r.id}>
                  {showHeader && (
                    <div className="flex items-center gap-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {dayLabel(r.appointment_date)}
                    </div>
                  )}
                  <div className="grid grid-cols-[170px_1fr_1fr_140px_150px_1fr_150px_60px] items-center gap-4 rounded-lg px-2 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(r.appointment_date)}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.appointment_time.slice(0, 5)} Uhr
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {r.vorname} {r.nachname}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        Start: {r.start_date ? formatDate(r.start_date) : "—"}
                      </div>
                    </div>
                    <span className="truncate text-muted-foreground">{r.email || "—"}</span>
                    <span className="truncate font-mono text-xs">{r.telefon || "—"}</span>
                    <span className="truncate text-muted-foreground">{r.stelle || "—"}</span>
                    <span className="truncate text-muted-foreground" title={r.notes ?? ""}>
                      {r.notes || "—"}
                    </span>
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
                    <div className="flex justify-end">
                      <Button size="icon" variant="ghost" title="Löschen" onClick={() => remove(r)}>
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

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Onboarding-Termin anlegen</DialogTitle>
            <DialogDescription>
              Bewerbung suchen, Termin festlegen und Arbeitstage/Stunden notieren.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bewerbung suchen</Label>
              {selected ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {selected.vorname} {selected.nachname}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {selected.email} · {selected.handynummer || "—"}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                    Ändern
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      className="pl-9"
                      placeholder="Name, E-Mail oder Telefon…"
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
                    {searching ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Suche…
                      </div>
                    ) : hits.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {appSearch.trim().length < 2
                          ? "Mindestens 2 Zeichen eingeben."
                          : "Keine Bewerbung gefunden."}
                      </div>
                    ) : (
                      hits.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setSelected(h)}
                          className="flex w-full flex-col items-start border-b border-border/60 px-3 py-2 text-left text-sm last:border-0 hover:bg-accent/60"
                        >
                          <span className="font-medium">
                            {h.vorname} {h.nachname}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {h.email} · {h.handynummer || "—"} · {h.stelle || h.anstellung || "—"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ob-date">Datum</Label>
                <Input
                  id="ob-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-time">Uhrzeit</Label>
                <Input
                  id="ob-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ob-notes">Notiz (Arbeitstage / Stunden)</Label>
              <Textarea
                id="ob-notes"
                rows={4}
                placeholder="z. B. Mo–Fr, 09:00–14:00, 25 Std./Woche"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ob-start">Startdatum</Label>
              <Input
                id="ob-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {startAsap && !startDate
                  ? "Im Bewerbungsgespräch wurde „schnellstmöglich“ angegeben — bitte Datum wählen."
                  : "Wird aus dem Bewerbungsgespräch übernommen, kann manuell geändert werden."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
