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
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      if (!form) return;
      const { error } = await supabase.from("app_settings").update(patch).eq("id", form.id);
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
    email: "max@example.com",
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
                placeholder="Sekreteriat24"
                value={form.resend_from_name ?? ""}
                onChange={(e) => set("resend_from_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Absender-E-Mail</Label>
              <Input
                placeholder="no-reply@sekreteriat24.de"
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
                Platzhalter: <code>{"{{vorname}}"}</code>, <code>{"{{nachname}}"}</code>, <code>{"{{email}}"}</code>
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
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>E-Mail-Vorschau</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">Von</div>
              <div className="font-medium">
                {form.resend_from_name || "—"} &lt;{form.resend_from_email || "no-reply@example.com"}&gt;
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">Betreff</div>
              <div className="font-medium">
                {renderTemplate(form.application_email_subject ?? "", previewVars)}
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm whitespace-pre-wrap">
              {renderTemplate(form.application_email_body ?? "", previewVars)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
