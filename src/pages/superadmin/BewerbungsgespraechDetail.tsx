import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Check,
  X,
  CalendarIcon,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";


type Detail = {
  id: string;
  application_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  start_date: string | null;
  start_asap: boolean | null;
  booked_at: string;
  applications: {
    id: string;
    vorname: string;
    nachname: string;
    email: string;
    handynummer: string;
    geburtsdatum: string;
    staatsangehoerigkeit: string;
    anstellung: string;
    status: string;
    ranking: string | null;
    created_at: string;
    lebenslauf_path: string | null;
    lebenslauf_filename: string | null;
    lebenslauf_mime: string | null;
  } | null;
};

const STATUS_OPTIONS = [
  { value: "neu", label: "Offen" },
  { value: "erfolgreich", label: "Erfolgreich" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
  { value: "mailbox", label: "Mailbox" },
];

const RANKING_LABELS: Record<string, string> = {
  sehr_gut: "Sehr gut",
  gut: "Gut",
  mittel: "Mittel",
  schlecht: "Schlecht",
};

const APP_STATUS_LABELS: Record<string, string> = {
  neu: "Neu",
  gesichtet: "Gesichtet",
  bewerbungsgespraech: "Gespräch-Link gesendet",
  termin_gebucht: "Termin gebucht",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
};

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "erfolgreich") return "default";
  if (s === "fehlgeschlagen") return "destructive";
  return "secondary";
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function age(birth: string) {
  const b = new Date(birth + "T00:00:00");
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-2.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

/** "01.08.2026" | "1.8.26" | "2026-08-01" -> "2026-08-01" oder null */
function parseGermanDate(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let y: number, m: number, d: number;
  if (iso) {
    y = +iso[1];
    m = +iso[2];
    d = +iso[3];
  } else {
    const de = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
    if (!de) return null;
    d = +de[1];
    m = +de[2];
    y = +de[3];
    if (y < 100) y += 2000;
  }
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isoToGerman(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default function BewerbungsgespraechDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [startInput, setStartInput] = useState("");
  const [startAsap, setStartAsap] = useState(false);
  const [savingStart, setSavingStart] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("interview_appointments")
        .select(
          "id, application_id, appointment_date, appointment_time, status, notes, start_date, start_asap, booked_at, applications(id, vorname, nachname, email, handynummer, geburtsdatum, staatsangehoerigkeit, anstellung, status, ranking, created_at, lebenslauf_path, lebenslauf_filename, lebenslauf_mime)",
        )
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("[BewerbungsgespraechDetail] load failed:", error.message);
        toast.error("Termin konnte nicht geladen werden");
      }
      const d = (data as Detail) ?? null;
      setRow(d);
      setNotes(d?.notes ?? "");
      setStartInput(isoToGerman(d?.start_date));
      setStartAsap(Boolean(d?.start_asap));
      setLoading(false);


      const path = d?.applications?.lebenslauf_path;
      if (path) {
        const { data: signed } = await supabase.storage
          .from("applications")
          .createSignedUrl(path, 60 * 60);
        if (!cancelled) setCvUrl(signed?.signedUrl ?? null);

        const isDocx =
          path.toLowerCase().endsWith(".docx") ||
          !!d?.applications?.lebenslauf_filename?.toLowerCase().endsWith(".docx");
        if (!cancelled && isDocx && signed?.signedUrl) {
          try {
            const [{ default: mammoth }, { default: DOMPurify }] = await Promise.all([
              import("mammoth/mammoth.browser"),
              import("dompurify"),
            ]);
            const res = await fetch(signed.signedUrl);
            const arrayBuffer = await res.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            if (!cancelled) setDocxHtml(DOMPurify.sanitize(result.value));
          } catch (e) {
            console.warn("[BewerbungsgespraechDetail] DOCX-Vorschau fehlgeschlagen", e);
          }
        }
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function setStatus(status: string) {
    if (!row) return;
    const { error } = await (supabase as any)
      .from("interview_appointments")
      .update({ status })
      .eq("id", row.id);
    if (error) {
      toast.error("Status-Update fehlgeschlagen");
      return;
    }
    const prevStatus = row.status;
    setRow({ ...row, status });
    toast.success("Status aktualisiert");
    void logActivity({
      action: "Status geändert",
      entityType: "interview_appointment",
      entityId: row.id,
      details: {
        subject: row.applications
          ? `${row.applications.vorname} ${row.applications.nachname}`
          : undefined,
        from: STATUS_OPTIONS.find((o) => o.value === prevStatus)?.label ?? prevStatus,
        to: STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status,
      },
    });
  }

  async function saveNotes() {
    if (!row) return;
    setSavingNotes(true);
    const { error } = await (supabase as any)
      .from("interview_appointments")
      .update({ notes })
      .eq("id", row.id);
    setSavingNotes(false);
    if (error) {
      toast.error("Notiz konnte nicht gespeichert werden");
      return;
    }
    setRow({ ...row, notes });
    toast.success("Notiz gespeichert");
    void logActivity({
      action: "Notiz gespeichert",
      entityType: "interview_appointment",
      entityId: row.id,
      details: {
        subject: row.applications
          ? `${row.applications.vorname} ${row.applications.nachname}`
          : undefined,
      },
    });
  }

  async function saveStartDate() {
    if (!row) return;
    let startDate: string | null = null;
    if (!startAsap) {
      const trimmed = startInput.trim();
      if (trimmed) {
        startDate = parseGermanDate(trimmed);
        if (!startDate) {
          toast.error("Ungültiges Datum – bitte Format TT.MM.JJJJ verwenden");
          return;
        }
      }
    }
    setSavingStart(true);
    const { error } = await (supabase as any)
      .from("interview_appointments")
      .update({ start_date: startDate, start_asap: startAsap })
      .eq("id", row.id);
    setSavingStart(false);
    if (error) {
      toast.error("Startdatum konnte nicht gespeichert werden");
      return;
    }
    setRow({ ...row, start_date: startDate, start_asap: startAsap });
    setStartInput(isoToGerman(startDate));
    toast.success("Startdatum gespeichert");
    void logActivity({
      action: "Startdatum geändert",
      entityType: "interview_appointment",
      entityId: row.id,
      details: {
        subject: row.applications
          ? `${row.applications.vorname} ${row.applications.nachname}`
          : undefined,
        to: startAsap ? "Ab sofort" : startDate ? isoToGerman(startDate) : "—",
      },
    });
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!row) {
    return (
      <>
        <PageHeader title="Bewerbungsgespräch" subtitle="Termin nicht gefunden." />
        <Button variant="outline" onClick={() => navigate("/superadmin/bewerbungsgespraeche")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
      </>
    );
  }

  const a = row.applications;
  const mime = a?.lebenslauf_mime ?? null;

  return (
    <>
      <PageHeader
        title={a ? `${a.vorname} ${a.nachname}` : "Bewerbungsgespräch"}
        subtitle={`${formatDate(row.appointment_date)} · ${row.appointment_time.slice(0, 5)} Uhr`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/superadmin/bewerbungsgespraeche")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            <Select value={row.status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setStatus("erfolgreich")}>
              <Check className="mr-2 h-4 w-4 text-primary" />
              Erfolgreich
            </Button>
            <Button variant="outline" onClick={() => setStatus("fehlgeschlagen")}>
              <X className="mr-2 h-4 w-4 text-destructive" />
              Fehlgeschlagen
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Termin">
            <Field label="Datum">{formatDate(row.appointment_date)}</Field>
            <Field label="Uhrzeit">{row.appointment_time.slice(0, 5)} Uhr</Field>
            <Field label="Status">
              <Badge variant={statusVariant(row.status)} className="w-fit">
                {STATUS_OPTIONS.find((s) => s.value === row.status)?.label ?? row.status}
              </Badge>
            </Field>
            <Field label="Gebucht am">{formatDateTime(row.booked_at)}</Field>
          </Panel>

          <Panel title="Bewerberdaten">
            {a ? (
              <>
                <Field label="Vorname">{a.vorname}</Field>
                <Field label="Nachname">{a.nachname}</Field>
                <Field label="E-Mail">
                  <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {a.email}
                  </a>
                </Field>
                <Field label="Telefon">
                  <a href={`tel:${a.handynummer}`} className="inline-flex items-center gap-1.5 font-mono underline-offset-2 hover:underline">
                    <Phone className="h-3.5 w-3.5" />
                    {a.handynummer}
                  </a>
                </Field>
                <Field label="Geburtsdatum">
                  {formatShortDate(a.geburtsdatum + "T00:00:00")} ({age(a.geburtsdatum)} Jahre)
                </Field>
                <Field label="Staatsangehörigkeit">{a.staatsangehoerigkeit}</Field>
                <Field label="Gewünschte Anstellung">
                  <span className="capitalize">{a.anstellung}</span>
                </Field>
                <Field label="Ranking">
                  {a.ranking ? (RANKING_LABELS[a.ranking] ?? a.ranking) : "—"}
                </Field>
                <Field label="Bewerbungsstatus">
                  {APP_STATUS_LABELS[a.status] ?? a.status}
                </Field>
                <Field label="Bewerbung eingegangen">{formatDateTime(a.created_at)}</Field>
              </>
            ) : (
              <div className="py-4 text-sm text-muted-foreground">
                Zugehörige Bewerbung nicht gefunden.
              </div>
            )}
          </Panel>

          <Panel title="Startdatum">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Input
                  value={startAsap ? "" : startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  disabled={startAsap}
                  placeholder={startAsap ? "Ab sofort" : "TT.MM.JJJJ"}
                  className="h-9"
                />
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={startAsap}
                      title="Datum auswählen"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={de}
                      selected={
                        parseGermanDate(startInput)
                          ? new Date(parseGermanDate(startInput)! + "T00:00:00")
                          : undefined
                      }
                      onSelect={(d) => {
                        if (!d) return;
                        setStartInput(
                          `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`,
                        );
                        setCalOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={startAsap}
                  onCheckedChange={(v) => setStartAsap(Boolean(v))}
                />
                Ab sofort
              </label>

              <div className="flex justify-end">
                <Button size="sm" onClick={saveStartDate} disabled={savingStart}>
                  {savingStart && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </div>
          </Panel>


          <Panel title="Gesprächsnotizen">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Notizen zum Gespräch…"
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                {savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </Panel>
        </div>

        <Panel
          title="Lebenslauf"
          className="flex min-h-[70vh] flex-col"
          action={
            cvUrl ? (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Neuer Tab
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href={cvUrl}
                    download={a?.lebenslauf_filename ?? "Lebenslauf"}
                  >
                    Download
                  </a>
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
            {!a?.lebenslauf_path ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <FileText className="h-10 w-10 opacity-40" />
                Kein Lebenslauf hinterlegt.
              </div>
            ) : !cvUrl ? (
              <div className="flex h-full min-h-[400px] items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : docxHtml ? (
              <div
                className="prose prose-sm h-full max-w-none overflow-auto bg-background p-6"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            ) : mime?.startsWith("image/") ? (
              <div className="flex h-full min-h-[400px] items-center justify-center overflow-auto p-4">
                <img
                  src={cvUrl}
                  alt={a.lebenslauf_filename ?? "Lebenslauf"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : mime && !mime.includes("pdf") ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center text-sm text-muted-foreground">
                <FileText className="h-10 w-10 opacity-40" />
                Vorschau für diesen Dateityp nicht möglich.
                <Button asChild variant="outline">
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    In neuem Tab öffnen
                  </a>
                </Button>
              </div>
            ) : (
              <iframe
                src={cvUrl}
                title={a.lebenslauf_filename ?? "Lebenslauf"}
                className="h-full min-h-[70vh] w-full border-0"
              />
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
