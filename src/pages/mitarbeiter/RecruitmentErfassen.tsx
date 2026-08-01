import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";

import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { callerApi, extractList, normalizeInterview } from "@/hooks/use-caller-api";
import { fmtDauer } from "@/lib/mitarbeiter-mock";

export default function RecruitmentErfassen({ interviewId }: { interviewId: string }) {
  const navigate = useNavigate();
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
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");

  const interview = useQuery({
    queryKey: ["caller-interview", interviewId],
    queryFn: async () => {
      const data = await callerApi<any>("list_interviews", { interview_id: interviewId });
      const list = extractList(data).map(normalizeInterview);
      return list.find((r) => r.id === interviewId) ?? list[0] ?? null;
    },
  });

  const clientRow = useQuery({
    enabled: !!client?.id,
    queryKey: ["client-call-script", client?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, is_recruitment, call_script_path")
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

  async function openScript() {
    const path = clientRow.data?.call_script_path;
    if (!path) {
      toast.error("Für diesen Kunden ist kein Call-Skript hinterlegt.");
      return;
    }
    const { data, error } = await supabase.storage
      .from("call-scripts")
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      toast.error("Call-Skript konnte nicht geladen werden.");
      return;
    }
    setScriptUrl(data.signedUrl);
    setScriptOpen(true);
  }

  async function sendPanelLink() {
    setBusy("panel");
    try {
      await callerApi("send_panel_link", { interview_id: interviewId });
      toast.success("Panel-Link gesendet");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendReminder() {
    setBusy("reminder");
    try {
      await callerApi("send_reminder", {
        interview_id: interviewId,
        ...(reminderText.trim() ? { message: reminderText.trim() } : {}),
      });
      toast.success("Erinnerung gesendet");
      setReminderOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveAndClose() {
    if (!outcome) return toast.error("Bitte Ergebnis auswählen.");
    if (outcome === "fehlgeschlagen" && !note.trim())
      return toast.error("Bitte eine Notiz zum Fehlschlag eintragen.");
    setSaving(true);
    try {
      await callerApi("set_status", {
        interview_id: interviewId,
        status: outcome,
        notes: note.trim() || null,
      });
      toast.success("Ergebnis gespeichert");
      navigate("/mitarbeiter/bewerbungsgespraeche");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const iv = interview.data;

  return (
    <>
      <PageHeader
        title="Recruiting-Anruf"
        subtitle="Gesprächsleitfaden, Kontaktdaten und Ergebnis in einem Screen."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Phone className="h-3 w-3" /> Outbound
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
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
                  <FileText className="h-4 w-4" /> Call-Skript öffnen
                </Button>
              </div>
            )}
          </Panel>

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
                  <a
                    href={`tel:${iv.phone}`}
                    className="flex items-center gap-2 hover:text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">{iv.phone}</span>
                  </a>
                )}
                {iv.email && (
                  <a
                    href={`mailto:${iv.email}`}
                    className="flex items-center gap-2 hover:text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate text-xs">{iv.email}</span>
                  </a>
                )}
                {iv.employment && (
                  <div className="text-xs capitalize text-muted-foreground">
                    Anstellung: {iv.employment}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
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
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setReminderOpen(true)}
                >
                  <BellRing className="h-4 w-4" /> Erinnerung senden
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

      <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Call-Skript</DialogTitle>
          </DialogHeader>
          {scriptUrl && (
            <iframe src={scriptUrl} title="Call-Skript" className="h-[70vh] w-full rounded-md border" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erinnerung senden</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={6}
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            placeholder="Optionaler Text — leer lassen für die Standard-Erinnerung."
          />
          <Button onClick={sendReminder} disabled={busy === "reminder"} className="gap-2">
            {busy === "reminder" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            Senden
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
