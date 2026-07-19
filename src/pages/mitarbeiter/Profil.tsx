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

function SipBlock({ employee }: { employee: EmployeeRow }) {
  const [show, setShow] = useState(false);

  function copy(text: string | null, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  }

  const hasSip =
    employee.sip_server || employee.sip_username || employee.sip_password || employee.sip_phone_number;

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Phone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Deine SIP-Zugangsdaten</div>
          {employee.sip_phone_number && (
            <div className="text-xs text-muted-foreground">{employee.sip_phone_number}</div>
          )}
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Phone className="h-3 w-3" /> Softphone
        </Badge>
      </div>

      {!hasSip ? (
        <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
          Für dich sind noch keine SIP-Daten hinterlegt. Bitte wende dich an die Administration.
        </div>
      ) : (
        <div className="space-y-2">
          {[
            { label: "Telefonnummer", value: employee.sip_phone_number, secret: false },
            { label: "Server", value: employee.sip_server, secret: false },
            { label: "Benutzername", value: employee.sip_username, secret: false },
            {
              label: "Passwort",
              value: employee.sip_password,
              display: show ? employee.sip_password ?? "" : "••••••••",
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
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShow((v) => !v)}>
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select(
          "first_name, last_name, login_email, personal_email, personal_phone, contract_type, start_date, sip_phone_number, sip_server, sip_username, sip_password",
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) toast.error("Mitarbeiterdaten konnten nicht geladen werden");
      setEmployee(data ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fullName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") || "—";

  return (
    <>
      <PageHeader title="Profil & Vertrag" subtitle="Deine Stammdaten und Zugangsinformationen." />

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
              Trage diese Daten in Phonerlite ein, um Anrufe entgegennehmen zu können.
            </p>
            {employee ? (
              <SipBlock employee={employee} />
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Kein Mitarbeiterdatensatz gefunden.
              </div>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
