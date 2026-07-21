import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Play, Square, Save, RotateCcw, PhoneCall, Info } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDauer } from "@/lib/mitarbeiter-mock";

const KATEGORIEN = ["Rückruf", "Termin", "Info", "Beschwerde", "Weiterleitung"] as const;

export default function Erfassen() {
  const [params, setParams] = useSearchParams();
  const { clients, byId, logoUrls } = useAssignedClients();
  const { user } = useAuth();
  const preselectedId = params.get("client") ?? "";
  const callId = params.get("call");

  const [clientId, setClientId] = useState(preselectedId);
  const [running, setRunning] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const [anruferName, setAnruferName] = useState("");
  const [anruferNummer, setAnruferNummer] = useState("");
  const [anruferEmail, setAnruferEmail] = useState("");
  const [anliegen, setAnliegen] = useState("");
  const [kategorie, setKategorie] = useState<string>("");
  const [prioritaet, setPrioritaet] = useState("normal");
  const [weitergeleitetAn, setWeitergeleitetAn] = useState("");
  const [ticketErstellen, setTicketErstellen] = useState(false);
  const [rueckruf, setRueckruf] = useState(false);
  const [rueckrufZeit, setRueckrufZeit] = useState("");

  useEffect(() => {
    if (preselectedId) setClientId(preselectedId);
  }, [preselectedId]);

  // Prefill from a live sipgate call
  useEffect(() => {
    if (!callId || !user) return;
    let cancelled = false;
    (async () => {
      const { data: call, error } = await supabase
        .from("sipgate_calls")
        .select("*")
        .eq("id", callId)
        .maybeSingle();
      if (cancelled || error || !call) return;

      if (call.client_id) setClientId(call.client_id);
      if (call.from_number) setAnruferNummer(call.from_number);
      if (call.caller_name) setAnruferName(call.caller_name);

      const baseTime = call.answered_at ?? call.started_at;
      if (baseTime && (call.status === "ringing" || call.status === "answered")) {
        setStart(new Date(baseTime).getTime());
        setRunning(true);
      }

      // Claim the call as handler
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (emp?.id) {
        await supabase
          .from("sipgate_calls")
          .update({ handled_by_employee_id: emp.id })
          .eq("id", callId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [callId, user]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const client = clientId ? byId(clientId) : undefined;
  const elapsed = useMemo(() => (start ? Math.floor((Date.now() - start) / 1000) : 0), [start, tick, running]);

  function startCall() {
    setStart(Date.now());
    setRunning(true);
  }
  function stopCall() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setStart(null);
    setAnruferName("");
    setAnruferNummer("");
    setAnruferEmail("");
    setAnliegen("");
    setKategorie("");
    setPrioritaet("normal");
    setWeitergeleitetAn("");
    setTicketErstellen(false);
    setRueckruf(false);
    setRueckrufZeit("");
    params.delete("client");
    params.delete("call");
    setParams(params, { replace: true });
    setClientId("");
  }
  function save(closeAfter: boolean) {
    if (!clientId) return toast.error("Bitte Kunde auswählen.");
    if (!anliegen.trim()) return toast.error("Bitte Anliegen eintragen.");
    toast.success(closeAfter ? "Anruf gespeichert." : "Anruf gespeichert — neuer Anruf.");
    if (!closeAfter) reset();
  }

  return (
    <>
      <PageHeader
        title="Anruf erfassen"
        subtitle="Softphone bleibt lokal — hier dokumentierst du das Gespräch."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Info className="h-3 w-3" /> Manuelle Erfassung
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Links: Kontext */}
        <div className="space-y-6">
          <Panel title="Kunde">
            {!client ? (
              <div className="space-y-3">
                <Label>Kunden auswählen</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="— Kunden wählen —" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Nur zugewiesene Kunden werden angezeigt.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ClientLogo logoUrl={logoUrls[client.id]} name={client.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.branche}</div>
                    <button
                      onClick={() => setClientId("")}
                      className="mt-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      Wechseln
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Begrüßung
                  </div>
                  <div className="mt-1 rounded-lg bg-ink-deep p-3 font-mono text-xs text-on-ink">
                    „{client.begruessung}"
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Firmeninhalt
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                    {client.firmeninhalt}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ansprechpartner</span>
                    <span className="font-medium">{client.ansprechpartner}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Weiterleitung</span>
                    <span className="font-mono">
                      {client.weiterleitung ? "aktiv" : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Rechts: Formular */}
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
                <Button onClick={startCall} className="flex-1 gap-2" disabled={!clientId}>
                  <Play className="h-4 w-4" /> Anruf starten
                </Button>
              ) : (
                <Button onClick={stopCall} variant="destructive" className="flex-1 gap-2">
                  <Square className="h-4 w-4" /> Anruf beenden
                </Button>
              )}
              <Button onClick={reset} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Timer läuft manuell — starte, sobald du im Softphone angenommen hast.
            </p>
          </Panel>

          <Panel title="Anrufer">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="an-name">Name</Label>
                <Input
                  id="an-name"
                  value={anruferName}
                  onChange={(e) => setAnruferName(e.target.value)}
                  placeholder="z. B. Frau Schulze"
                />
              </div>
              <div>
                <Label htmlFor="an-tel">Telefon</Label>
                <Input
                  id="an-tel"
                  value={anruferNummer}
                  onChange={(e) => setAnruferNummer(e.target.value)}
                  placeholder="+49 …"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="an-mail">E-Mail (optional)</Label>
                <Input
                  id="an-mail"
                  type="email"
                  value={anruferEmail}
                  onChange={(e) => setAnruferEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </Panel>

          <Panel title="Anliegen">
            <div className="space-y-4">
              <Textarea
                value={anliegen}
                onChange={(e) => setAnliegen(e.target.value)}
                placeholder="Was möchte der Anrufer? Was wurde besprochen?"
                rows={5}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Kategorie</Label>
                  <Select value={kategorie} onValueChange={setKategorie}>
                    <SelectTrigger>
                      <SelectValue placeholder="— wählen —" />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORIEN.map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorität</Label>
                  <Select value={prioritaet} onValueChange={setPrioritaet}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="hoch">Hoch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {kategorie === "Weiterleitung" && (
                <div>
                  <Label htmlFor="weiter">Weitergeleitet an</Label>
                  <Input
                    id="weiter"
                    value={weitergeleitetAn}
                    onChange={(e) => setWeitergeleitetAn(e.target.value)}
                    placeholder="z. B. Dr. Meier / +49 …"
                  />
                </div>
              )}

              <div className="space-y-2 rounded-lg bg-surface/60 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={rueckruf}
                    onCheckedChange={(v) => setRueckruf(v === true)}
                  />
                  Rückruf gewünscht
                </label>
                {rueckruf && (
                  <Input
                    placeholder="Zeitfenster (z. B. morgen 10–12 Uhr)"
                    value={rueckrufZeit}
                    onChange={(e) => setRueckrufZeit(e.target.value)}
                  />
                )}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={ticketErstellen}
                    onCheckedChange={(v) => setTicketErstellen(v === true)}
                  />
                  Ticket erstellen (Aufgabe für Kunde)
                </label>
              </div>
            </div>
          </Panel>

          <div className="flex gap-2">
            <Button onClick={() => save(false)} variant="outline" className="flex-1 gap-2">
              <PhoneCall className="h-4 w-4" /> Speichern & Neuer Anruf
            </Button>
            <Button onClick={() => save(true)} className="flex-1 gap-2">
              <Save className="h-4 w-4" /> Speichern & Schließen
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
