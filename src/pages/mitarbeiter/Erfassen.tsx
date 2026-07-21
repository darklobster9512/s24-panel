import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Play, Square, Save, RotateCcw, PhoneCall, Info, Phone, Mail, Globe, MapPin, User, PhoneForwarded } from "lucide-react";
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

function normalizePhone(v?: string | null): string {
  if (!v) return "";
  const trimmed = v.trim().replace(/[^\d+]/g, "");
  if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/\+/g, "");
  if (trimmed.startsWith("00")) return "+" + trimmed.slice(2);
  if (trimmed.startsWith("0")) return "+49" + trimmed.slice(1);
  return trimmed;
}

export default function Erfassen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, byId, logoUrls } = useAssignedClients();
  const { user } = useAuth();
  const preselectedId = params.get("client") ?? "";
  const callId = params.get("call");

  const [clientId, setClientId] = useState(preselectedId);
  const [running, setRunning] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);

  const [anruferName, setAnruferName] = useState("");
  const [anruferNummer, setAnruferNummer] = useState("");
  const [anruferEmail, setAnruferEmail] = useState("");
  const [anliegen, setAnliegen] = useState("");
  const [kategorie, setKategorie] = useState<string>("");
  const [prioritaet, setPrioritaet] = useState("normal");
  const [weitergeleitetAn, setWeitergeleitetAn] = useState("");
  const [knownCaller, setKnownCaller] = useState(false);


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

  // Lookup known caller contact by phone (per client) and prefill empty fields
  useEffect(() => {
    if (!clientId) return;
    const normalized = normalizePhone(anruferNummer);
    if (!normalized || normalized.length < 4) {
      setKnownCaller(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("caller_contacts")
        .select("caller_name, caller_email")
        .eq("client_id", clientId)
        .eq("phone_number", normalized)
        .maybeSingle();
      if (cancelled || error || !data) {
        if (!cancelled) setKnownCaller(false);
        return;
      }
      setKnownCaller(true);
      setAnruferName((prev) => (prev.trim() ? prev : data.caller_name ?? ""));
      setAnruferEmail((prev) => (prev.trim() ? prev : data.caller_email ?? ""));
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, anruferNummer]);



  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Broadcast call-active state so the layout can flip status to "Im Gespräch"
  useEffect(() => {
    if (running) {
      window.dispatchEvent(new CustomEvent("sekreteriat24:call-started"));
      return () => {
        window.dispatchEvent(new CustomEvent("sekreteriat24:call-ended"));
      };
    }
  }, [running]);

  // Auto-stop timer when sipgate reports hangup for this call
  useEffect(() => {
    function onHangup(e: Event) {
      const detail = (e as CustomEvent).detail as {
        callId?: string;
        from?: string | null;
        to?: string | null;
      };
      if (!detail) return;
      const matchesCall = callId && detail.callId === callId;
      const normalize = (v?: string | null) =>
        (v ?? "").replace(/[^\d+]/g, "");
      const matchesNumbers =
        !!anruferNummer &&
        normalize(detail.from) === normalize(anruferNummer);
      if (!matchesCall && !matchesNumbers) return;
      if (running) {
        setRunning(false);
        toast.info("Anruf beendet — Timer gestoppt");
      }
    }
    window.addEventListener("sipgate:hangup", onHangup);
    return () => window.removeEventListener("sipgate:hangup", onHangup);
  }, [callId, anruferNummer, running]);

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
    setKnownCaller(false);
    setAnliegen("");
    setKategorie("");
    setPrioritaet("normal");
    setWeitergeleitetAn("");
    
    setRueckruf(false);
    setRueckrufZeit("");
    params.delete("client");
    params.delete("call");
    setParams(params, { replace: true });
    setClientId("");
  }
  async function save(closeAfter: boolean) {
    if (!clientId) return toast.error("Bitte Kunde auswählen.");
    if (!anliegen.trim()) return toast.error("Bitte Anliegen eintragen.");
    if (!user) return toast.error("Nicht angemeldet.");
    setSaving(true);
    try {
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (empErr || !emp?.id) {
        toast.error("Mitarbeiter-Profil nicht gefunden.");
        return;
      }
      const { error } = await supabase.from("call_notes").insert({
        client_id: clientId,
        employee_id: emp.id,
        sipgate_call_id: callId ?? null,
        anrufer_name: anruferName || null,
        anrufer_nummer: anruferNummer || null,
        anrufer_email: anruferEmail || null,
        anliegen: anliegen.trim(),
        kategorie: kategorie || null,
        prioritaet,
        weitergeleitet_an: kategorie === "Weiterleitung" ? weitergeleitetAn || null : null,
        rueckruf_gewuenscht: rueckruf,
        rueckruf_zeit: rueckruf ? rueckrufZeit || null : null,
        
        dauer_sekunden: elapsed,
      });
      if (error) {
        console.error(error);
        toast.error("Speichern fehlgeschlagen: " + error.message);
        return;
      }

      // Remember caller by phone number (per client) so next call auto-fills
      const normalizedPhone = normalizePhone(anruferNummer);
      if (normalizedPhone && (anruferName.trim() || anruferEmail.trim())) {
        const { error: ccErr } = await supabase
          .from("caller_contacts")
          .upsert(
            {
              client_id: clientId,
              phone_number: normalizedPhone,
              caller_name: anruferName.trim() || null,
              caller_email: anruferEmail.trim() || null,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "client_id,phone_number" },
          );
        if (ccErr) console.warn("caller_contacts upsert failed", ccErr);
      }

      toast.success(closeAfter ? "Anruf gespeichert." : "Anruf gespeichert — neuer Anruf.");
      if (closeAfter) {
        navigate("/mitarbeiter/notizen");
      } else {
        reset();
      }
    } finally {
      setSaving(false);
    }
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

                {(client.telefon || client.email || client.website || client.adresse) && (
                  <div className="space-y-1.5 border-t border-border/60 pt-3 text-xs">
                    {client.telefon && (
                      <a href={`tel:${client.telefon}`} className="flex items-center gap-2 text-foreground hover:text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-mono">{client.telefon}</span>
                      </a>
                    )}
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-foreground hover:text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{client.email}</span>
                      </a>
                    )}
                    {client.website && (
                      <a href={client.website.startsWith("http") ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary hover:underline">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{client.website}</span>
                      </a>
                    )}
                    {client.adresse && (
                      <div className="flex items-start gap-2 text-foreground/90">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{client.adresse}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-border/60 pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Begrüßung
                  </div>
                  <div className="mt-1 rounded-lg bg-ink-deep p-3 font-mono text-xs text-on-ink">
                    „{client.begruessung}"
                  </div>
                </div>

                {client.firmeninhalt && (
                  <div className="border-t border-border/60 pt-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Firmeninhalt
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      {client.firmeninhalt}
                    </p>
                  </div>
                )}

                {(client.ansprechpartner || client.ansprechpartnerTel || client.ansprechpartnerEmail) && (
                  <div className="border-t border-border/60 pt-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Ansprechpartner
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs">
                      {client.ansprechpartner && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium">{client.ansprechpartner}</span>
                        </div>
                      )}
                      {client.ansprechpartnerTel && (
                        <a href={`tel:${client.ansprechpartnerTel}`} className="flex items-center gap-2 text-foreground hover:text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-mono">{client.ansprechpartnerTel}</span>
                        </a>
                      )}
                      {client.ansprechpartnerEmail && (
                        <a href={`mailto:${client.ansprechpartnerEmail}`} className="flex items-center gap-2 text-foreground hover:text-primary hover:underline">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{client.ansprechpartnerEmail}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-[11px]">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${client.weiterleitung ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    <PhoneForwarded className="h-3 w-3" />
                    Weiterleitung {client.weiterleitung ? "aktiv" : "inaktiv"}
                  </span>
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
              Timer startet automatisch, wenn du den Anruf in der sipgate App annimmst, und stoppt beim Auflegen.
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
              </div>
            </div>
          </Panel>

          <div className="flex gap-2">
            <Button onClick={() => save(false)} variant="outline" className="flex-1 gap-2" disabled={saving}>
              <PhoneCall className="h-4 w-4" /> Speichern & Neuer Anruf
            </Button>
            <Button onClick={() => save(true)} className="flex-1 gap-2" disabled={saving}>
              <Save className="h-4 w-4" /> Speichern & Schließen
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
