import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeRow {
  first_name: string | null;
  last_name: string | null;
  login_email: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  contract_type: string | null;
  start_date: string | null;
}

interface SipClient {
  id: string;
  company_name: string | null;
  logo_url: string | null;
  logoSignedUrl?: string;
  sip_phone_number: string | null;
  sip_server: string | null;
  sip_username: string | null;
  sip_password: string | null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
      {initials || "?"}
    </div>
  );
}

function SipBlock({ client }: { client: SipClient }) {
  const [show, setShow] = useState(false);
  const name = client.company_name ?? "Kunde";

  function copy(text: string | null, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  }

  const hasSip = client.sip_server || client.sip_username || client.sip_password;

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
      <div className="mb-4 flex items-center gap-3">
        {client.logoSignedUrl ? (
          <img
            src={client.logoSignedUrl}
            alt={name}
            className="h-12 w-12 rounded-lg object-contain bg-white p-1"
          />
        ) : (
          <Initials name={name} />
        )}
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          {client.sip_phone_number && (
            <div className="text-xs text-muted-foreground">{client.sip_phone_number}</div>
          )}
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Phone className="h-3 w-3" /> Softphone
        </Badge>
      </div>

      {!hasSip ? (
        <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
          SIP-Daten für diesen Kunden noch nicht hinterlegt.
        </div>
      ) : (
        <div className="space-y-2">
          {[
            { label: "Server", value: client.sip_server, secret: false },
            { label: "Benutzername", value: client.sip_username, secret: false },
            {
              label: "Passwort",
              value: client.sip_password,
              display: show ? client.sip_password ?? "" : "••••••••",
              secret: true,
            },
          ].map((row: any) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
            >
              <div className="w-32 text-xs uppercase tracking-wider text-muted-foreground">
                {row.label}
              </div>
              <div className="flex-1 font-mono text-sm break-all">
                {row.display ?? row.value ?? "—"}
              </div>
              {row.secret && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => copy(row.value, row.label)}
                disabled={!row.value}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [sipClients, setSipClients] = useState<SipClient[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [{ data: emp, error: empErr }, { data: assigns, error: aErr }] = await Promise.all([
        supabase
          .from("employees")
          .select("first_name, last_name, login_email, personal_email, personal_phone, contract_type, start_date")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("assignments")
          .select(
            `client:clients (
              id, company_name, logo_url, is_draft,
              sip_phone_number, sip_server, sip_username, sip_password
            )`,
          ),
      ]);

      if (cancelled) return;

      if (empErr) toast.error("Mitarbeiterdaten konnten nicht geladen werden");
      if (aErr) toast.error("Zuweisungen konnten nicht geladen werden");

      setEmployee(emp ?? null);

      const seen = new Set<string>();
      const clients: SipClient[] = [];
      for (const row of (assigns ?? []) as any[]) {
        const c = row.client;
        if (!c || c.is_draft || seen.has(c.id)) continue;
        seen.add(c.id);
        clients.push({
          id: c.id,
          company_name: c.company_name,
          logo_url: c.logo_url,
          sip_phone_number: c.sip_phone_number,
          sip_server: c.sip_server,
          sip_username: c.sip_username,
          sip_password: c.sip_password,
        });
      }

      // Signed URLs für Logos
      await Promise.all(
        clients
          .filter((c) => c.logo_url)
          .map(async (c) => {
            const { data: signed } = await supabase.storage
              .from("client-logos")
              .createSignedUrl(c.logo_url as string, 3600);
            c.logoSignedUrl = signed?.signedUrl;
          }),
      );

      if (!cancelled) {
        setSipClients(clients);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fullName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") || "—";

  return (
    <>
      <PageHeader
        title="Profil & Vertrag"
        subtitle="Deine Stammdaten und Zugangsinformationen."
      />

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Persönliche Daten">
            <Row label="Name" value={fullName} />
            <Row label="Login E-Mail" value={employee?.login_email ?? user?.email ?? ""} />
            <Row label="Private E-Mail" value={employee?.personal_email ?? ""} />
            <Row label="Telefon" value={employee?.personal_phone ?? ""} />
            <Row label="Rolle" value="Mitarbeiter" />
          </Panel>

          <Panel title="Vertrag">
            <Row label="Vertragsart" value={employee?.contract_type ?? ""} />
            <Row label="Startdatum" value={formatDate(employee?.start_date ?? null)} />
            <Row label="Status" value="Aktiv" />
          </Panel>

          <Panel title="SIP-Zugangsdaten (Phonerlite)" className="lg:col-span-2">
            <p className="mb-4 text-sm text-muted-foreground">
              Trage diese Daten in Phonerlite ein, um für den jeweiligen Kunden telefonieren zu können.
            </p>

            {sipClients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Dir sind aktuell keine Kunden zugewiesen.
              </div>
            ) : (
              <div className="grid gap-4">
                {sipClients.map((c) => (
                  <SipBlock key={c.id} client={c} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
