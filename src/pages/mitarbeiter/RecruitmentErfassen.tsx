import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Play,
  Square,
  Save,
  FileText,
  Link2,
  BellRing,
  Loader2,
  Check,
  X,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { supabase } from "@/integrations/supabase/client";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { callerApi, findInterviewById } from "@/hooks/use-caller-api";
import { fmtDauer } from "@/lib/mitarbeiter-mock";
import { renderCallScript, lastNameOf } from "@/lib/call-script-vars";

export default function RecruitmentErfassen({ interviewId }: { interviewId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { clients, logoUrls } = useAssignedClients();
  const client = clients[0];

  const [running, setRunning] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<"erfolgreich" | "fehlgeschlagen" | "">("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [copied, setCopied] = useState<"phone" | "email" | null>(null);

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

  const interview = useQuery({
    queryKey: ["caller-interview", interviewId],
    queryFn: () => findInterviewById(interviewId),
  });

  const clientRow = useQuery({
    enabled: !!client?.id,
    queryKey: ["client-call-script", client?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select(
          "id, is_recruitment, call_script_path, call_script_content, call_script_my_name, call_script_company_name",
        )
        .eq("id", client!.id)
        .maybeSingle();
      return data;
    },
  });

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

  const clientData = clientRow.data as {
    call_script_content?: string | null;
    call_script_my_name?: string | null;
    call_script_company_name?: string | null;
  } | null;
  const scriptHtml = clientData?.call_script_content;

  const renderedScript = renderCallScript(scriptHtml ?? "", {
    Bewerber_Name: lastNameOf(interview.data?.name),
    Mein_Name: clientData?.call_script_my_name ?? "",
    Firmenname: clientData?.call_script_company_name ?? client?.name ?? "",
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
    toast.error(
      "Kein Call-Skript hinterlegt – bitte im Kunden-Wizard, Schritt 5 pflegen.",
    );
  }




  async function sendPanelLink() {
    setBusy("panel");
    try {
      await callerApi("send_panel_link", { appointment_id: interviewId });
      toast.success("Panel-Link gesendet");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendPanelLinkEmail(email: string) {
    setBusy("panel-mail");
    try {
      await callerApi("send_panel_link_email", { appointmentId: interviewId });
      toast.success(`Panel-Link an ${email} gesendet`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /** Holt den Standardtext der API und sendet die Erinnerung direkt. */
  async function sendReminder() {
    setBusy("reminder");
    try {
      const preview = await callerApi<any>("send_reminder", {
        appointment_id: interviewId,
        preview: true,
      });
      const text = String(preview?.message ?? "").trim();
      if (!text) throw new Error("Kein Erinnerungstext von der API erhalten.");
      await callerApi("send_reminder", { appointment_id: interviewId, text });
      toast.success("Erinnerung gesendet");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /** Ermittelt den Kunden des Callers – notfalls frisch aus der Datenbank. */
  async function resolveClientId(employeeId: string): Promise<string | null> {
    if (client?.id) return client.id;
    const { data, error } = await supabase
      .from("assignments")
      .select("client_id")
      .eq("employee_id", employeeId)
      .limit(1)
      .maybeSingle();
    if (error) console.error("[RecruitmentErfassen] assignment lookup failed", error);
    return data?.client_id ?? null;
  }

  /** Speichert die Notiz lokal in call_notes. Wirft bei jedem Fehlschlag. */
  async function persistNoteLocally(): Promise<string> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) throw new Error("Nicht angemeldet – bitte neu einloggen.");

    const { data: emp, error: empErr } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (empErr) {
      console.error("[RecruitmentErfassen] employee lookup failed", empErr);
      throw new Error("Mitarbeiter-Profil konnte nicht geladen werden.");
    }
    if (!emp?.id) throw new Error("Kein Mitarbeiter-Profil gefunden.");

    const clientId = await resolveClientId(emp.id);
    if (!clientId) throw new Error("Kein zugewiesener Kunde gefunden – bitte Zuweisung prüfen.");

    const iv = interview.data;
    const text =
      note.trim() ||
      (outcome === "erfolgreich"
        ? "Recruiting-Anruf erfolgreich"
        : "Recruiting-Anruf fehlgeschlagen");

    const { data: inserted, error } = await supabase
      .from("call_notes")
      .insert({
        client_id: clientId,
        employee_id: emp.id,
        anrufer_name: iv?.name ?? null,
        anrufer_nummer: iv?.phone ?? null,
        anrufer_email: iv?.email ?? null,
        anliegen: `[${outcome === "erfolgreich" ? "Erfolgreich" : "Fehlgeschlagen"}] ${text}`,
        kategorie: "Termin",
        prioritaet: "normal",
        rueckruf_gewuenscht: false,
        dauer_sekunden: elapsed,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[RecruitmentErfassen] call_notes insert failed", error);
      throw new Error("Notiz konnte nicht gespeichert werden: " + error.message);
    }
    if (!inserted?.id) throw new Error("Notiz konnte nicht gespeichert werden.");

    supabase.functions
      .invoke("call-note-notify", { body: { note_id: inserted.id, kind: "outbound" } })
      .catch((e) => console.warn("call-note-notify failed", e));

    return inserted.id;
  }

  async function saveAndClose() {
    if (!outcome) return toast.error("Bitte Ergebnis auswählen.");
    if (outcome === "fehlgeschlagen" && !note.trim())
      return toast.error("Bitte eine Notiz zum Fehlschlag eintragen.");
    setSaving(true);
    try {
      // 1. Zuerst lokal sichern – so geht der Notiztext nie verloren.
      try {
        await persistNoteLocally();
      } catch (e) {
        toast.error((e as Error).message);
        return;
      }
      qc.invalidateQueries({ queryKey: ["mitarbeiter-notes"] });
      qc.invalidateQueries({ queryKey: ["stat-data"] });

      // 2. Danach an die externe Caller-API übertragen.
      try {
        await callerApi("set_status", {
          appointment_id: interviewId,
          status: outcome,
          note: note.trim(),
        });
      } catch (e) {
        console.error("[RecruitmentErfassen] set_status failed", e);
        toast.warning(
          "Notiz gespeichert, aber das Ergebnis konnte nicht an die Caller-API übertragen werden: " +
            (e as Error).message,
        );
        return;
      }

      toast.success("Ergebnis gespeichert");
      navigate("/mitarbeiter/bewerbungsgespraeche");
    } finally {
      setSaving(false);
    }
  }



  const iv = interview.data;

  return (
    <>
      <div className="sticky top-14 z-20 -mx-6 -mt-8 border-b border-border/60 bg-surface/90 px-6 pt-8 backdrop-blur">
        <PageHeader
          title="Recruiting-Anruf"
          subtitle="Gesprächsleitfaden, Kontaktdaten und Ergebnis in einem Screen."
          actions={
            <Badge variant="outline" className="gap-1.5">
              <Phone className="h-3 w-3" /> Outbound
            </Badge>
          }
        />
      </div>


      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Panel title="Bewerber">
            {interview.isLoading ? (
              <p className="text-sm text-muted-foreground">Lade Termin…</p>
            ) : !iv ? (
              <p className="text-sm text-destructive">Termin nicht gefunden.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="text-base font-semibold">{iv.name}</div>
                <div className="text-xs text-muted-foreground">
                  {iv.date ?? "—"} {iv.time ? `· ${iv.time} Uhr` : ""}
                </div>
                {iv.phone && (
                  <button
                    type="button"
                    title="Zum Kopieren klicken"
                    onClick={() => copyValue(iv.phone!, "phone")}
                    className="flex w-full items-center gap-2 rounded text-left hover:text-primary hover:underline"
                  >
                    {copied === "phone" ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-mono text-xs">{iv.phone}</span>
                  </button>
                )}
                {iv.email && (
                  <button
                    type="button"
                    title="Zum Kopieren klicken"
                    onClick={() => copyValue(iv.email!, "email")}
                    className="flex w-full items-center gap-2 rounded text-left hover:text-primary hover:underline"
                  >
                    {copied === "email" ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate text-xs">{iv.email}</span>
                  </button>
                )}
                {iv.employment && (
                  <div className="text-xs capitalize text-muted-foreground">
                    Anstellung: {iv.employment}
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Kunde">
            {!client ? (
              <p className="text-sm text-muted-foreground">
                Dir ist noch kein Kunde zugewiesen.
              </p>
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

          <Panel title="Aktionen & Ergebnis">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={busy === "panel"}
                  onClick={sendPanelLink}
                >
                  {busy === "panel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Panel-Link per SMS senden
                </Button>
                {iv?.email && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={busy === "panel-mail"}
                    onClick={() => sendPanelLinkEmail(iv.email!)}
                  >
                    {busy === "panel-mail" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Panel-Link per E-Mail
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={sendReminder}
                  disabled={busy === "reminder"}
                >
                  {busy === "reminder" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BellRing className="h-4 w-4" />
                  )}{" "}
                  Erinnerung senden
                </Button>
              </div>

              <div>
                <Label htmlFor="rec-note">Gesprächsnotiz</Label>
                <Textarea
                  id="rec-note"
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
