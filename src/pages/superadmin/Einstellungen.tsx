import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Einstellungen() {
  return (
    <>
      <PageHeader
        title="Einstellungen"
        subtitle="Firmendaten, Integrationen und Systemkonfiguration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Firmendaten">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Firmenname</Label>
              <Input defaultValue="Sekreteriat24 GmbH" />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input defaultValue="Musterstraße 12, 10115 Berlin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>USt-ID</Label>
                <Input defaultValue="DE123456789" />
              </div>
              <div className="space-y-1.5">
                <Label>Steuernummer</Label>
                <Input defaultValue="12/345/67890" />
              </div>
            </div>
            <Button size="sm">Speichern</Button>
          </div>
        </Panel>

        <Panel title="Integrationen">
          <ul className="space-y-3">
            {[
              { name: "Telefonie · sipgate", enabled: true },
              { name: "E-Mail · Postmark", enabled: true },
              { name: "Kalender · Google Workspace", enabled: false },
              { name: "Buchhaltung · lexoffice", enabled: true },
              { name: "Zahlungen · Stripe", enabled: false },
            ].map((i) => (
              <li key={i.name} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
                <span className="text-sm font-medium">{i.name}</span>
                <Switch defaultChecked={i.enabled} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Rollen & Berechtigungen">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="font-medium">Superadmin</span>
              <span className="text-xs text-muted-foreground">Vollzugriff</span>
            </li>
            <li className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="font-medium">Mitarbeiter</span>
              <span className="text-xs text-muted-foreground">Zugewiesene Kunden, Calls, Notizen</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-medium">Kunde</span>
              <span className="text-xs text-muted-foreground">Eigene Anrufe, Notizen</span>
            </li>
          </ul>
        </Panel>

        <Panel title="Branding">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Akzentfarbe</Label>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md border border-border" style={{ background: "#7bed9f" }} />
                <Input defaultValue="#7bed9f" className="max-w-[160px] font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Logo-Text</Label>
              <Input defaultValue="Sekreteriat24" />
            </div>
            <Button size="sm" variant="outline">Speichern</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
