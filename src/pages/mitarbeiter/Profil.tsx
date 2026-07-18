import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { CURRENT_EMPLOYEE } from "@/lib/mitarbeiter-mock";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function Profil() {
  const { user } = useAuth();
  const [showSip, setShowSip] = useState(false);

  const sip = {
    server: "sipgate.de",
    username: "s24-sofia",
    password: "••••••••",
  };

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  }

  return (
    <>
      <PageHeader
        title="Profil & Vertrag"
        subtitle="Deine Stammdaten und Zugangsinformationen."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Persönliche Daten">
          <Row label="Name" value={CURRENT_EMPLOYEE.name} />
          <Row label="Login E-Mail" value={user?.email ?? CURRENT_EMPLOYEE.loginEmail} />
          <Row label="Rolle" value="Mitarbeiter" />
        </Panel>

        <Panel title="Vertrag">
          <Row label="Vertragsart" value={CURRENT_EMPLOYEE.contractType} />
          <Row label="Startdatum" value={CURRENT_EMPLOYEE.startDate} />
          <Row label="Status" value="Aktiv" />
        </Panel>

        <Panel
          title="Passwort"
          className="lg:col-span-2"
          action={
            <Button size="sm" variant="outline" className="gap-2">
              <KeyRound className="h-4 w-4" /> Passwort ändern
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            Ändere regelmäßig dein Passwort. Nutze mindestens 8 Zeichen, Buchstaben und Zahlen.
          </p>
        </Panel>

        <Panel
          title="SIP-Zugangsdaten (Phonerlite)"
          className="lg:col-span-2"
          action={
            <Badge variant="secondary" className="gap-1.5">
              <Phone className="h-3 w-3" /> Softphone
            </Badge>
          }
        >
          <p className="mb-4 text-sm text-muted-foreground">
            Diese Daten trägst du einmalig in Phonerlite ein, um telefonieren zu können.
          </p>

          <div className="space-y-2">
            {[
              { label: "Server", value: sip.server, secret: false },
              { label: "Benutzername", value: sip.username, secret: false },
              { label: "Passwort", value: showSip ? "S3kret!Muster" : sip.password, secret: true },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/40 p-3"
              >
                <div className="w-32 text-xs uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </div>
                <div className="flex-1 font-mono text-sm">{row.value}</div>
                {row.secret && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setShowSip((v) => !v)}
                  >
                    {showSip ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => copy(row.value, row.label)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
            SIP-Daten werden später aus deiner Employee-Konfiguration geladen. Derzeit Demo-Werte.
          </div>
        </Panel>
      </div>
    </>
  );
}
