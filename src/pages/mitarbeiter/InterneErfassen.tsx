import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Play,
  Square,
  Save,
  FileText,
  Voicemail,
  Loader2,
  Check,
  X,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { fmtDauer } from "@/lib/mitarbeiter-mock";
import { renderCallScript, lastNameOf } from "@/lib/call-script-vars";
import { AIGIS_CLIENT_ID, RANKING_OPTIONS } from "@/lib/internal-recruitment";

type Appointment = {
  id: string;
  application_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  start_date: string | null;
  start_asap: boolean | null;
  applications: {
    id: string;
    vorname: string;
    nachname: string;
    email: string | null;
    handynummer: string | null;
    anstellung: string | null;
    stelle: string | null;
    geburtsdatum: string | null;
    ranking: string | null;
    lebenslauf_path: string | null;
    lebenslauf_filename: string | null;
    lebenslauf_mime: string | null;
  } | null;
};

/** "01.08.2026" | "2026-08-01" -> "2026-08-01" oder null */
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

export default function InterneErfassen({ terminId }: { terminId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { clients, logoUrls } = useAssignedClients();
  const client = clients.find((c) => c.id === AIGIS_CLIENT_ID) ?? clients[0];

  const [running, setRunning] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<"erfolgreich" | "fehlgeschlagen" | "mailbox" | "">("");
  const [ranking, setRanking] = useState<string>("none");
  const [startInput, setStartInput] = useState("");
  const [startAsap, setStartAsap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [copied, setCopied] = useState<"phone" | "email" | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);

  const appt = useQuery({
    queryKey: ["intern-interview", terminId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_appointments")
        .select(
          "id, application_id, appointment_date, appointment_time, status, notes, start_date, start_asap, applications(id, vorname, nachname, email, handynummer, anstellung, stelle, geburtsdatum, ranking, lebenslauf_path, lebenslauf_filename, lebenslauf_mime)",
        )
        .eq("id", terminId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as Appointment | null;
    },
  });

  const row = appt.data;
  const a = row?.applications ?? null;

  useEffect(() => {
    if (!row) return;
    setNote(row.notes ?? "");
    setStartInput(isoToGerman(row.start_date));
    setStartAsap(Boolean(row.start_asap));
    setRanking(row.applications?.ranking ?? "none");
  }, [row]);

  // Lebenslauf laden (signierte URL + ggf. DOCX-Konvertierung)
  useEffect(() => {
    let cancelled = false;
    setCvUrl(null);
    setDocxHtml(null);
    const path = a?.lebenslauf_path;
    if (!path) return;
    (async () => {
      const { data: signed } = await supabase.storage
        .from("applications")
        .createSignedUrl(path, 60 * 60);
      if (cancelled || !signed?.signedUrl) return;
      setCvUrl(signed.signedUrl);

      const isDocx =
        path.toLowerCase().endsWith(".docx") ||
        !!a?.lebenslauf_filename?.toLowerCase().endsWith(".docx");
      if (!isDocx) return;
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
        console.warn("[InterneErfassen] DOCX-Vorschau fehlgeschlagen", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [a?.lebenslauf_path, a?.lebenslauf_filename]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running) {
      window.dispatchEvent(new CustomEvent("sekreteriat24:call-started"));
      return () => {
        window.dispatchEvent(new CustomEvent("sekreteriat24:call-ended"));
      };
    }
  }, [running]);

  const elapsed = start ? Math.floor((Date.now() - start) / 1000) : 0;

  const scriptHtml = client?.callSkript ?? "";
  const applicantName = a ? `${a.vorname} ${a.nachname}` : "";
  const renderedScript = renderCallScript(scriptHtml, {
    Bewerber_Name: lastNameOf(applicantName),
    Mein_Name: client?.skriptMeinName ?? "",
    Firmenname: client?.skriptFirmenname ?? client?.name ?? "",
  });

  function openScript() {
    if (scriptOpen) {
      setScriptOpen(false);
      return;
    }
    if (scriptHtml && scriptHtml.replace(/<[^>]*>/g, "").trim()) {
      setScriptOpen(true);
      return;
    }
    toast.error("Kein Call-Skript hinterlegt – bitte im Kunden-Wizard, Schritt 5 pflegen.");
  }

  async function copyValue(value: string, kind: "phone" | "email") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "phone" ? "Nummer kopiert" : "E-Mail kopiert");
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
    } catch {
      toast.error("Kopieren nicht möglich");
    }
  }

  async function saveAndClose() {
    if (!row) return;
    if (!outcome) return toast.error("Bitte Ergebnis auswählen.");
    if (outcome === "fehlgeschlagen" && !note.trim())
      return toast.error("Bitte eine Notiz zum Fehlschlag eintragen.");

    let startDate: string | null = null;
    if (!startAsap && startInput.trim()) {
      startDate = parseGermanDate(startInput);
      if (!startDate) {
        toast.error("Ungültiges Startdatum – bitte Format TT.MM.JJJJ verwenden");
        return;
      }
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Nicht angemeldet – bitte neu einloggen.");

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (!emp?.id) throw new Error("Kein Mitarbeiter-Profil gefunden.");

      const outcomeLabel =
        outcome === "erfolgreich"
          ? "Erfolgreich"
          : outcome === "mailbox"
            ? "Mailbox"
            : "Fehlgeschlagen";
      const text =
        note.trim() ||
        (outcome === "erfolgreich"
          ? "Bewerbungsgespräch erfolgreich"
          : outcome === "mailbox"
            ? "Mailbox erreicht"
            : "Bewerbungsgespräch fehlgeschlagen");

      // 1. Notiz lokal sichern
      const { data: inserted, error: noteErr } = await supabase
        .from("call_notes")
        .insert({
          client_id: client?.id ?? AIGIS_CLIENT_ID,
          employee_id: emp.id,
          anrufer_name: applicantName || null,
          anrufer_nummer: a?.handynummer ?? null,
          anrufer_email: a?.email ?? null,
          anliegen: `[${outcomeLabel}] ${text}`,
          kategorie: "Termin",
          prioritaet: "normal",
          rueckruf_gewuenscht: false,
          dauer_sekunden: elapsed,
        })
        .select("id")
        .maybeSingle();
      if (noteErr) throw new Error("Notiz konnte nicht gespeichert werden: " + noteErr.message);

      if (inserted?.id) {
        supabase.functions
          .invoke("call-note-notify", { body: { note_id: inserted.id, kind: "outbound" } })
          .catch((e) => console.warn("call-note-notify failed", e));
      }

      // 2. Termin aktualisieren
      const { error: apptErr } = await supabase
        .from("interview_appointments")
        .update({
          status: outcome,
          notes: note.trim() || null,
          start_date: startAsap ? null : startDate,
          start_asap: startAsap,
        })
        .eq("id", row.id);
      if (apptErr) throw new Error("Termin konnte nicht aktualisiert werden: " + apptErr.message);

      // 3. Ranking am Bewerber
      if (row.application_id) {
        const { error: rankErr } = await supabase
          .from("applications")
          .update({ ranking: ranking === "none" ? null : ranking })
          .eq("id", row.application_id);
        if (rankErr) console.error("[InterneErfassen] ranking update failed", rankErr);
      }

      qc.invalidateQueries({ queryKey: ["mitarbeiter-notes"] });
      qc.invalidateQueries({ queryKey: ["stat-data"] });
      qc.invalidateQueries({ queryKey: ["intern-interviews"] });
      toast.success("Ergebnis gespeichert");
      navigate("/mitarbeiter/bewerbungsgespraeche");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const mime = a?.lebenslauf_mime ?? null;

  return (
    <>
      <div className="sticky top-14 z-20 -mx-6 -mt-8 border-b border-border/60 bg-surface/90 px-6 pt-8 backdrop-blur">
        <PageHeader
          title="Bewerbungsgespräch"
          subtitle="Gesprächsleitfaden, Bewerberdaten und Ergebnis in einem Screen."
          actions={
            <Badge variant="outline" className="gap-1.5">
              <Phone className="h-3 w-3" /> Intern
            </Badge>
          }
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Panel title="Bewerber">
            {appt.isLoading ? (
              <p className="text-sm text-muted-foreground">Lade Termin…</p>
            ) : !row ? (
              <p className="text-sm text-destructive">Termin nicht gefunden.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="text-base font-semibold">{applicantName || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {isoToGerman(row.appointment_date)} · {row.appointment_time?.slice(0, 5)} Uhr
                </div>
                {a?.handynummer && (
                  <button
                    type="button"
                    title="Zum Kopieren klicken"
                    onClick={() => copyValue(a.handynummer!, "phone")}
                    className="flex w-full items-center gap-2 rounded text-left hover:text-primary hover:underline"
                  >
                    {copied === "phone" ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-mono text-xs">{a.handynummer}</span>
                  </button>
                )}
                {a?.email && (
                  <button
                    type="button"
                    title="Zum Kopieren klicken"
                    onClick={() => copyValue(a.email!, "email")}
                    className="flex w-full items-center gap-2 rounded text-left hover:text-primary hover:underline"
                  >
                    {copied === "email" ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate text-xs">{a.email}</span>
                  </button>
                )}
                {a?.anstellung && (
                  <div className="text-xs capitalize text-muted-foreground">
                    Anstellung: {a.anstellung}
                  </div>
                )}
                {a?.stelle && (
                  <div className="text-xs text-muted-foreground">Stelle: {a.stelle}</div>
                )}
                {a?.geburtsdatum && (
                  <div className="text-xs text-muted-foreground">
                    Geburtsdatum: {isoToGerman(a.geburtsdatum)}
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Kunde">
            {!client ? (
              <p className="text-sm text-muted-foreground">Dir ist noch kein Kunde zugewiesen.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ClientLogo logoUrl={logoUrls[client.id]} name={client.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.branche}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={openScript}>
                  <FileText className="h-4 w-4" />
                  {scriptOpen ? "Call-Skript schließen" : "Call-Skript öffnen"}
                  {scriptOpen ? (
                    <ChevronUp className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </Panel>

          {scriptOpen && (
            <Panel title="Call-Skript">
              <div
                className="rich-text prose prose-sm max-w-none [&_h1]:mt-0 [&_h2]:mt-6 [&_h2]:text-primary"
                dangerouslySetInnerHTML={{ __html: renderedScript }}
              />
            </Panel>
          )}

          <Panel
            title="Lebenslauf"
            action={
              cvUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Neuer Tab
                  </a>
                </Button>
              ) : undefined
            }
          >
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              {!a?.lebenslauf_path ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-40" />
                  Kein Lebenslauf hinterlegt.
                </div>
              ) : !cvUrl ? (
                <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : docxHtml ? (
                <div
                  className="prose prose-sm max-h-[70vh] max-w-none overflow-auto bg-background p-6"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              ) : mime?.startsWith("image/") ? (
                <div className="flex max-h-[70vh] items-center justify-center overflow-auto p-4">
                  <img
                    src={cvUrl}
                    alt={a.lebenslauf_filename ?? "Lebenslauf"}
                    className="max-w-full object-contain"
                  />
                </div>
              ) : mime && !mime.includes("pdf") ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-40" />
                  Vorschau für diesen Dateityp nicht möglich.
                </div>
              ) : (
                <iframe
                  src={cvUrl}
                  title={a.lebenslauf_filename ?? "Lebenslauf"}
                  className="h-[70vh] w-full border-0"
                />
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-44 lg:self-start">
          <Panel
            title="Gesprächs-Timer"
            action={
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {fmtDauer(elapsed)}
              </span>
            }
          >
            <div className="flex gap-2">
              {!running ? (
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    setStart(Date.now());
                    setRunning(true);
                  }}
                >
                  <Play className="h-4 w-4" /> Anruf starten
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setRunning(false)}
                >
                  <Square className="h-4 w-4" /> Anruf beenden
                </Button>
              )}
            </div>
          </Panel>

          <Panel title="Bewertung & Start">
            <div className="space-y-4">
              <div>
                <Label>Ranking</Label>
                <Select value={ranking} onValueChange={setRanking}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Ranking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Ranking</SelectItem>
                    {RANKING_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">Startdatum</Label>
                <Input
                  id="start-date"
                  placeholder="TT.MM.JJJJ"
                  value={startInput}
                  disabled={startAsap}
                  onChange={(e) => setStartInput(e.target.value)}
                />
                <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={startAsap}
                    onCheckedChange={(v) => setStartAsap(v === true)}
                  />
                  Ab sofort startklar
                </label>
              </div>
            </div>
          </Panel>

          <Panel title="Ergebnis">
            <div className="space-y-4">
              <div>
                <Label htmlFor="intern-note">Gesprächsnotiz</Label>
                <Textarea
                  id="intern-note"
                  rows={6}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Was wurde besprochen? Nächste Schritte?"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={outcome === "erfolgreich" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setOutcome("erfolgreich")}
                >
                  <Check className="h-4 w-4" /> Erfolgreich
                </Button>
                <Button
                  variant={outcome === "fehlgeschlagen" ? "destructive" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setOutcome("fehlgeschlagen")}
                >
                  <X className="h-4 w-4" /> Fehlgeschlagen
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 gap-2 ${
                    outcome === "mailbox"
                      ? "bg-amber-400 text-amber-950 border-amber-400 hover:bg-amber-400/90 hover:text-amber-950"
                      : ""
                  }`}
                  onClick={() => setOutcome("mailbox")}
                >
                  <Voicemail className="h-4 w-4" /> Mailbox
                </Button>
              </div>
            </div>
          </Panel>

          <Button className="w-full gap-2" onClick={saveAndClose} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Speichern & Schließen
          </Button>
        </div>
      </div>
    </>
  );
}
