import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { renderApplicationEmailHtml, renderTemplate as renderTpl } from "@/lib/applicationEmail";
import InterviewBlockedSlots from "@/components/superadmin/InterviewBlockedSlots";

type Settings = {
  id: string;
  company_name: string | null;
  company_address: string | null;
  vat_id: string | null;
  accent_color: string | null;
  logo_text: string | null;
  resend_api_key: string | null;
  resend_from_name: string | null;
  resend_from_email: string | null;
  application_email_enabled: boolean;
  application_email_subject: string | null;
  application_email_body: string | null;
  interview_email_enabled: boolean;
  interview_email_subject: string | null;
  interview_email_body: string | null;
  confirmation_email_enabled: boolean;
  confirmation_email_subject: string | null;
  confirmation_email_body: string | null;
  welcome_email_enabled: boolean;
  welcome_email_subject: string | null;
  welcome_email_body: string | null;

  sms_enabled: boolean;
  seven_api_key: string | null;
  sms_sender_name: string | null;
  sms_interview_text: string | null;
  sms_confirmation_text: string | null;
  sms_reminder_text: string | null;


  interview_slot_start: string | null;
  interview_slot_end: string | null;
  interview_slot_interval_minutes: number | null;
  interview_available_weekdays: number[] | null;
};

export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export default function Einstellungen() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
  });

  const [form, setForm] = useState<Settings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showSevenKey, setShowSevenKey] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [interviewPreviewOpen, setInterviewPreviewOpen] = useState(false);
  const [confirmationPreviewOpen, setConfirmationPreviewOpen] = useState(false);
  const [welcomePreviewOpen, setWelcomePreviewOpen] = useState(false);


  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      if (!form) return;
      const { error } = await (supabase as any).from("app_settings").update(patch).eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gespeichert");
      qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler beim Speichern"),
  });

  if (!form) {
    return (
      <>
        <PageHeader title="Einstellungen" subtitle="Firmendaten und Systemkonfiguration." />
        <div className="text-sm text-muted-foreground">Lade…</div>
      </>
    );
  }

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });

  const previewVars = {
    vorname: "Max",
    nachname: "Mustermann",
    voller_name: "Max Mustermann",
    email: "max@example.com",
    datum: "12. August 2026",
    uhrzeit: "14:30",
    wochentag: "Mittwoch",
    booking_url: `${typeof window !== "undefined" ? window.location.origin : ""}/bewerbungsgespraech/beispiel-token`,
  };

  const welcomeVars = {
    vorname: "Max",
    nachname: "Mustermann",
    voller_name: "Max Mustermann",
    login_email: "m.mustermann@sekretariat24.app",
    passwort: "Bx7-tR29-qLm4",
    portal_url: "https://sekretariat24.app",
  };


  const WEEKDAYS = [
    { v: 1, l: "Mo" },
    { v: 2, l: "Di" },
    { v: 3, l: "Mi" },
    { v: 4, l: "Do" },
    { v: 5, l: "Fr" },
    { v: 6, l: "Sa" },
    { v: 7, l: "So" },
  ];
  const activeWeekdays = form.interview_available_weekdays ?? [1, 2, 3, 4, 5];
  const toggleWeekday = (v: number) => {
    const s = new Set(activeWeekdays);
    if (s.has(v)) s.delete(v); else s.add(v);
    set("interview_available_weekdays", Array.from(s).sort((a, b) => a - b));
  };

  return (
    <>
      <PageHeader title="Einstellungen" subtitle="Firmendaten und Systemkonfiguration." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Firmendaten">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Firmenname</Label>
              <Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.company_address ?? ""} onChange={(e) => set("company_address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>USt-ID</Label>
              <Input value={form.vat_id ?? ""} onChange={(e) => set("vat_id", e.target.value)} />
            </div>
            <Button
              size="sm"
              onClick={() =>
                save.mutate({
                  company_name: form.company_name,
                  company_address: form.company_address,
                  vat_id: form.vat_id,
                })
              }
              disabled={save.isPending}
            >
              Speichern
            </Button>
          </div>
        </Panel>

        <Panel title="Branding">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Akzentfarbe</Label>
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-md border border-border"
                  style={{ background: form.accent_color ?? "#7bed9f" }}
                />
                <Input
                  value={form.accent_color ?? ""}
                  onChange={(e) => set("accent_color", e.target.value)}
                  className="max-w-[160px] font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Logo-Text</Label>
              <Input value={form.logo_text ?? ""} onChange={(e) => set("logo_text", e.target.value)} />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => save.mutate({ accent_color: form.accent_color, logo_text: form.logo_text })}
              disabled={save.isPending}
            >
              Speichern
            </Button>
          </div>
        </Panel>

        <Panel title="Resend · E-Mail-Versand" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Resend API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="re_..."
                  value={form.resend_api_key ?? ""}
                  onChange={(e) => set("resend_api_key", e.target.value)}
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowKey((v) => !v)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Absender-Name</Label>
              <Input
                placeholder="Sekretariat24"
                value={form.resend_from_name ?? ""}
                onChange={(e) => set("resend_from_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Absender-E-Mail</Label>
              <Input
                placeholder="no-reply@sekretariat24.app"
                value={form.resend_from_email ?? ""}
                onChange={(e) => set("resend_from_email", e.target.value)}
              />
            </div>

            <div className="lg:col-span-2 flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Bestätigungsmail bei neuer Bewerbung</div>
                <div className="text-xs text-muted-foreground">
                  Sendet automatisch eine E-Mail an Bewerber, sobald das Formular abgeschickt wurde.
                </div>
              </div>
              <Switch
                checked={form.application_email_enabled}
                onCheckedChange={(v) => set("application_email_enabled", v)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Betreff</Label>
              <Input
                value={form.application_email_subject ?? ""}
                onChange={(e) => set("application_email_subject", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Nachricht</Label>
              <Textarea
                rows={10}
                value={form.application_email_body ?? ""}
                onChange={(e) => set("application_email_body", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leerzeile = neuer Absatz, einfacher Zeilenumbruch bleibt erhalten. Platzhalter: <code>{"{{vorname}}"}</code>, <code>{"{{nachname}}"}</code>, <code>{"{{email}}"}</code>
              </p>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  save.mutate({
                    resend_api_key: form.resend_api_key,
                    resend_from_name: form.resend_from_name,
                    resend_from_email: form.resend_from_email,
                    application_email_enabled: form.application_email_enabled,
                    application_email_subject: form.application_email_subject,
                    application_email_body: form.application_email_body,
                  })
                }
                disabled={save.isPending}
              >
                Speichern
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
                Vorschau
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="SMS · seven.io" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2 flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">SMS beim Annehmen einer Bewerbung</div>
                <div className="text-xs text-muted-foreground">
                  Sendet zusätzlich zur Einladungs-Mail eine SMS mit Shortlink an die Handynummer.
                </div>
              </div>
              <Switch
                checked={form.sms_enabled ?? false}
                onCheckedChange={(v) => set("sms_enabled", v)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>seven.io API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showSevenKey ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.seven_api_key ?? ""}
                  onChange={(e) => set("seven_api_key", e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSevenKey((v) => !v)}
                >
                  {showSevenKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Absendername (max. 11 Zeichen)</Label>
              <Input
                maxLength={11}
                placeholder="Sekretari24"
                value={form.sms_sender_name ?? ""}
                onChange={(e) =>
                  set("sms_sender_name", e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 11))
                }
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>SMS-Text Einladung</Label>
              <Textarea
                rows={4}
                value={form.sms_interview_text ?? ""}
                onChange={(e) => set("sms_interview_text", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Platzhalter: <code>{"{vorname}"}</code>, <code>{"{nachname}"}</code>,{" "}
                <code>{"{unternehmen}"}</code>, <code>{"{link}"}</code>. Handynummern werden
                automatisch ins internationale Format (+49…) umgewandelt.
              </p>
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>SMS-Text Terminbestätigung</Label>
              <Textarea
                rows={3}
                value={form.sms_confirmation_text ?? ""}
                onChange={(e) => set("sms_confirmation_text", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Wird direkt nach der Terminbuchung gesendet. Platzhalter:{" "}
                <code>{"{vorname}"}</code>, <code>{"{nachname}"}</code>,{" "}
                <code>{"{unternehmen}"}</code>, <code>{"{datum}"}</code>, <code>{"{uhrzeit}"}</code>.
              </p>
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>SMS-Text Erinnerung (1 Std. vorher)</Label>
              <Textarea
                rows={3}
                value={form.sms_reminder_text ?? ""}
                onChange={(e) => set("sms_reminder_text", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Wird automatisch eine Stunde vor dem Bewerbungsgespräch gesendet. Platzhalter:{" "}
                <code>{"{vorname}"}</code>, <code>{"{nachname}"}</code>,{" "}
                <code>{"{unternehmen}"}</code>, <code>{"{datum}"}</code>, <code>{"{uhrzeit}"}</code>.
              </p>
            </div>

            <div className="lg:col-span-2">
              <Button
                size="sm"
                onClick={() =>
                  save.mutate({
                    sms_enabled: form.sms_enabled,
                    seven_api_key: form.seven_api_key,
                    sms_sender_name: form.sms_sender_name,
                    sms_interview_text: form.sms_interview_text,
                    sms_confirmation_text: form.sms_confirmation_text,
                    sms_reminder_text: form.sms_reminder_text,
                  })
                }
                disabled={save.isPending}
              >
                Speichern
              </Button>
            </div>

          </div>
        </Panel>



        <Panel title="Bewerbungsgespräch · Einladungs-Mail" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2 flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Einladung nach Genehmigung senden</div>
                <div className="text-xs text-muted-foreground">
                  Sendet automatisch eine Mail mit persönlichem Termin-Link, sobald du eine Bewerbung genehmigst.
                </div>
              </div>
              <Switch
                checked={form.interview_email_enabled}
                onCheckedChange={(v) => set("interview_email_enabled", v)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Betreff</Label>
              <Input
                value={form.interview_email_subject ?? ""}
                onChange={(e) => set("interview_email_subject", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Nachricht</Label>
              <Textarea
                rows={10}
                value={form.interview_email_body ?? ""}
                onChange={(e) => set("interview_email_body", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Platzhalter: <code>{"{{vorname}}"}</code>, <code>{"{{nachname}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{booking_url}}"}</code>. Der Termin-Button wird zusätzlich automatisch eingefügt.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Slot-Start</Label>
              <Input
                type="time"
                value={(form.interview_slot_start ?? "09:00").slice(0, 5)}
                onChange={(e) => set("interview_slot_start", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slot-Ende</Label>
              <Input
                type="time"
                value={(form.interview_slot_end ?? "18:00").slice(0, 5)}
                onChange={(e) => set("interview_slot_end", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Intervall (Minuten)</Label>
              <Input
                type="number"
                min={10}
                max={180}
                step={5}
                value={form.interview_slot_interval_minutes ?? 30}
                onChange={(e) => set("interview_slot_interval_minutes", parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Verfügbare Wochentage</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((w) => {
                  const active = activeWeekdays.includes(w.v);
                  return (
                    <button
                      key={w.v}
                      type="button"
                      onClick={() => toggleWeekday(w.v)}
                      className={`h-9 min-w-9 rounded-md border px-2.5 text-sm font-medium transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-foreground/30"
                      }`}
                    >
                      {w.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  save.mutate({
                    interview_email_enabled: form.interview_email_enabled,
                    interview_email_subject: form.interview_email_subject,
                    interview_email_body: form.interview_email_body,
                    interview_slot_start: form.interview_slot_start,
                    interview_slot_end: form.interview_slot_end,
                    interview_slot_interval_minutes: form.interview_slot_interval_minutes,
                    interview_available_weekdays: form.interview_available_weekdays,
                  })
                }
                disabled={save.isPending}
              >
                Speichern
              </Button>
              <Button size="sm" variant="outline" onClick={() => setInterviewPreviewOpen(true)}>
                Vorschau
              </Button>
            </div>
          </div>
        </Panel>

        <InterviewBlockedSlots
          slotStart={form.interview_slot_start ?? "09:00"}
          slotEnd={form.interview_slot_end ?? "18:00"}
          intervalMinutes={form.interview_slot_interval_minutes ?? 30}
        />



        <Panel title="Bewerbungsgespräch · Terminbestätigung" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2 flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Bestätigung nach Buchung senden</div>
                <div className="text-xs text-muted-foreground">
                  Sendet automatisch eine Bestätigungs-Mail mit Datum und Uhrzeit, sobald ein Bewerber einen Termin
                  gebucht oder geändert hat.
                </div>
              </div>
              <Switch
                checked={form.confirmation_email_enabled}
                onCheckedChange={(v) => set("confirmation_email_enabled", v)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Betreff</Label>
              <Input
                value={form.confirmation_email_subject ?? ""}
                onChange={(e) => set("confirmation_email_subject", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Nachricht</Label>
              <Textarea
                rows={10}
                value={form.confirmation_email_body ?? ""}
                onChange={(e) => set("confirmation_email_body", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Platzhalter: <code>{"{{vorname}}"}</code>, <code>{"{{nachname}}"}</code>,{" "}
                <code>{"{{voller_name}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{datum}}"}</code>,{" "}
                <code>{"{{uhrzeit}}"}</code>, <code>{"{{wochentag}}"}</code>. Die Termin-Card mit Datum und Uhrzeit
                wird automatisch eingefügt.
              </p>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  save.mutate({
                    confirmation_email_enabled: form.confirmation_email_enabled,
                    confirmation_email_subject: form.confirmation_email_subject,
                    confirmation_email_body: form.confirmation_email_body,
                  })
                }
                disabled={save.isPending}
              >
                Speichern
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmationPreviewOpen(true)}>
                Vorschau
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Mitarbeiter · Zugangsdaten-E-Mail" className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2 flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Zugangsdaten nach Konto-Erstellung senden</div>
                <div className="text-xs text-muted-foreground">
                  Sendet automatisch eine E-Mail an die persönliche Adresse des Mitarbeiters mit Login-E-Mail,
                  Passwort und Link zum Portal.
                </div>
              </div>
              <Switch
                checked={form.welcome_email_enabled}
                onCheckedChange={(v) => set("welcome_email_enabled", v)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Betreff</Label>
              <Input
                value={form.welcome_email_subject ?? ""}
                onChange={(e) => set("welcome_email_subject", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label>Nachricht</Label>
              <Textarea
                rows={10}
                value={form.welcome_email_body ?? ""}
                onChange={(e) => set("welcome_email_body", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Platzhalter: <code>{"{{vorname}}"}</code>, <code>{"{{nachname}}"}</code>,{" "}
                <code>{"{{voller_name}}"}</code>, <code>{"{{login_email}}"}</code>, <code>{"{{passwort}}"}</code>,{" "}
                <code>{"{{portal_url}}"}</code>. Die Zugangsdaten-Card und der Login-Button werden automatisch
                eingefügt.
              </p>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  save.mutate({
                    welcome_email_enabled: form.welcome_email_enabled,
                    welcome_email_subject: form.welcome_email_subject,
                    welcome_email_body: form.welcome_email_body,
                  })
                }
                disabled={save.isPending}
              >
                Speichern
              </Button>
              <Button size="sm" variant="outline" onClick={() => setWelcomePreviewOpen(true)}>
                Vorschau
              </Button>
            </div>
          </div>
        </Panel>
      </div>


      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>E-Mail-Vorschau</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Von</div>
                <div className="font-medium truncate">
                  {form.resend_from_name || "—"} &lt;{form.resend_from_email || "no-reply@example.com"}&gt;
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Betreff</div>
                <div className="font-medium truncate">
                  {renderTpl(form.application_email_subject ?? "", previewVars)}
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-border bg-[#f5f7f5]">
              <iframe
                title="E-Mail Vorschau"
                sandbox=""
                style={{ width: "100%", height: 560, border: 0, background: "#f5f7f5" }}
                srcDoc={renderApplicationEmailHtml({
                  subject: renderTpl(form.application_email_subject ?? "Deine Bewerbung", previewVars),
                  bodyText: form.application_email_body ?? "",
                  vars: previewVars,
                  company: {
                    name: form.company_name ?? "Sekretariat24",
                    address: form.company_address,
                    logoText: form.logo_text ?? form.company_name ?? "Sekretariat24",
                    accent: form.accent_color ?? "#7bed9f",
                  },
                })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={interviewPreviewOpen} onOpenChange={setInterviewPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vorschau · Bewerbungsgespräch-Einladung</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Von</div>
                <div className="font-medium truncate">
                  {form.resend_from_name || "—"} &lt;{form.resend_from_email || "no-reply@example.com"}&gt;
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Betreff</div>
                <div className="font-medium truncate">
                  {renderTpl(form.interview_email_subject ?? "", previewVars)}
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-border bg-[#f5f7f5]">
              <iframe
                title="Interview E-Mail Vorschau"
                sandbox=""
                style={{ width: "100%", height: 560, border: 0, background: "#f5f7f5" }}
                srcDoc={renderApplicationEmailHtml({
                  subject: renderTpl(form.interview_email_subject ?? "Bewerbungsgespräch", previewVars),
                  bodyText: form.interview_email_body ?? "",
                  vars: previewVars,
                  company: {
                    name: form.company_name ?? "Sekretariat24",
                    address: form.company_address,
                    logoText: form.logo_text ?? form.company_name ?? "Sekretariat24",
                    accent: form.accent_color ?? "#7bed9f",
                  },
                  cta: { label: "Termin auswählen", url: previewVars.booking_url },
                  steps: [
                    { title: "Termin wählen", body: "Such dir über den Button oben einen passenden Zeitraum aus." },
                    { title: "Kurzes Kennenlerngespräch", body: "Wir sprechen ca. 20–30 Minuten online über deine Erfahrung und offene Fragen." },
                    { title: "Rückmeldung & nächste Schritte", body: "Direkt im Anschluss klären wir gemeinsam, wie es weitergeht." },
                  ],
                })}
              />
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmationPreviewOpen} onOpenChange={setConfirmationPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vorschau · Terminbestätigung</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Von</div>
                <div className="font-medium truncate">
                  {form.resend_from_name || "—"} &lt;{form.resend_from_email || "no-reply@example.com"}&gt;
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Betreff</div>
                <div className="font-medium truncate">
                  {renderTpl(form.confirmation_email_subject ?? "", previewVars)}
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-border bg-[#f5f7f5]">
              <iframe
                title="Terminbestätigung Vorschau"
                sandbox=""
                style={{ width: "100%", height: 560, border: 0, background: "#f5f7f5" }}
                srcDoc={renderApplicationEmailHtml({
                  subject: renderTpl(form.confirmation_email_subject ?? "Ihr Termin ist bestätigt", previewVars),
                  bodyText: form.confirmation_email_body ?? "",
                  vars: previewVars,
                  company: {
                    name: form.company_name ?? "Sekretariat24",
                    address: form.company_address,
                    logoText: form.logo_text ?? form.company_name ?? "Sekretariat24",
                    accent: form.accent_color ?? "#7bed9f",
                  },
                  infoCard: {
                    label: "Ihr Termin",
                    lines: [
                      `${previewVars.wochentag}, ${previewVars.datum}`,
                      `${previewVars.uhrzeit} Uhr`,
                    ],
                  },
                  steps: [
                    { title: "Termin notieren", body: "Tragen Sie sich den Termin am besten direkt in Ihren Kalender ein." },
                    { title: "Kurzes Kennenlerngespräch", body: "Wir sprechen ca. 20–30 Minuten über Ihre Erfahrung und offene Fragen." },
                    { title: "Rückmeldung & nächste Schritte", body: "Direkt im Anschluss klären wir gemeinsam, wie es weitergeht." },
                  ],
                })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={welcomePreviewOpen} onOpenChange={setWelcomePreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vorschau · Zugangsdaten Mitarbeiterkonto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Von</div>
                <div className="font-medium truncate">
                  {form.resend_from_name || "—"} &lt;{form.resend_from_email || "no-reply@example.com"}&gt;
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Betreff</div>
                <div className="font-medium truncate">
                  {renderTpl(form.welcome_email_subject ?? "", welcomeVars)}
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-border bg-[#f5f7f5]">
              <iframe
                title="Zugangsdaten E-Mail Vorschau"
                sandbox=""
                style={{ width: "100%", height: 560, border: 0, background: "#f5f7f5" }}
                srcDoc={renderApplicationEmailHtml({
                  subject: renderTpl(
                    form.welcome_email_subject ?? "Deine Zugangsdaten für dein Mitarbeiterkonto",
                    welcomeVars,
                  ),
                  bodyText: form.welcome_email_body ?? "",
                  vars: welcomeVars,
                  company: {
                    name: form.company_name ?? "Sekretariat24",
                    address: form.company_address,
                    logoText: form.logo_text ?? form.company_name ?? "Sekretariat24",
                    accent: form.accent_color ?? "#7bed9f",
                  },
                  infoCard: {
                    label: "Deine Zugangsdaten",
                    lines: [`E-Mail: ${welcomeVars.login_email}`, `Passwort: ${welcomeVars.passwort}`],
                  },
                  cta: { label: "Jetzt einloggen", url: welcomeVars.portal_url },
                  steps: [
                    { title: "Einloggen", body: "Melde dich mit den Zugangsdaten oben im Mitarbeiter-Portal an." },
                    { title: "Arbeitsvertrag ausfüllen", body: "Ergänze im Portal deine persönlichen Daten für den Arbeitsvertrag." },
                    { title: "Digital unterschreiben", body: "Prüfe den Vertrag und unterschreibe ihn direkt online." },
                  ],
                })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
