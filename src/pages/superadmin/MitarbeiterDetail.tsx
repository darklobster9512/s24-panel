import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Copy, Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4 py-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export default function MitarbeiterDetail() {
  const { id } = useParams<{ id: string }>();
  const [showPw, setShowPw] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    enabled: !!id,
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const pw = data?.password_plain ?? "";
  const fullName = `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim();

  return (
    <>
      <PageHeader
        title={fullName || "Mitarbeiter"}
        subtitle={data?.login_email ?? ""}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/superadmin/mitarbeiter">
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Link>
            </Button>
            {id && (
              <Button asChild size="sm">
                <Link to={`/superadmin/mitarbeiter/bearbeiten/${id}`}>
                  <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <Panel>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade…
          </div>
        </Panel>
      ) : isError ? (
        <Panel>
          <div className="py-8 text-center text-sm text-destructive">
            {(error as Error).message}
          </div>
        </Panel>
      ) : !data ? (
        <Panel>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nicht gefunden.
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">Stammdaten</h3>
            <div className="divide-y divide-border/60">
              <Row label="Vorname" value={data.first_name} />
              <Row label="Nachname" value={data.last_name} />
              <Row label="Persönliche E-Mail" value={data.personal_email} />
              <Row label="Persönliches Telefon" value={data.personal_phone} />
            </div>

            <h3 className="mb-3 mt-6 text-sm font-semibold">Vertrag</h3>
            <div className="divide-y divide-border/60">
              <Row
                label="Vertragsart"
                value={
                  data.contract_type ? (
                    <Badge variant="secondary" className="capitalize">
                      {data.contract_type}
                    </Badge>
                  ) : null
                }
              />
              <Row label="Startdatum" value={data.start_date} />
              <Row
                label="Gehalt"
                value={data.salary != null ? `${data.salary} €` : null}
              />
            </div>

            <h3 className="mb-3 mt-6 text-sm font-semibold">Persönliches</h3>
            <div className="divide-y divide-border/60">
              <Row label="Geburtsdatum" value={data.birth_date} />
              <Row label="Geburtsort" value={data.birth_place} />
              <Row label="Nationalität" value={data.nationality} />
              <Row label="Familienstand" value={data.marital_status} />
              <Row label="IBAN" value={<span className="font-mono">{data.iban}</span>} />
              <Row label="BIC" value={<span className="font-mono">{data.bic}</span>} />
              <Row label="Bank" value={data.bank_name} />
              <Row label="Steuer-ID" value={<span className="font-mono">{data.tax_id}</span>} />
              <Row label="SV-Nummer" value={<span className="font-mono">{data.social_security_number}</span>} />
              <Row label="Krankenkasse" value={data.health_insurance} />
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel>
              <h3 className="mb-3 text-sm font-semibold">Panel-Zugang</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Login-E-Mail
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="truncate font-mono text-sm">
                      {data.login_email ?? "—"}
                    </span>
                    {data.login_email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          navigator.clipboard.writeText(data.login_email!);
                          toast.success("E-Mail kopiert");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Passwort
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex-1 truncate font-mono text-sm">
                      {pw ? (showPw ? pw : "•".repeat(pw.length)) : "—"}
                    </span>
                    {pw && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowPw((v) => !v)}
                        >
                          {showPw ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(pw);
                            toast.success("Passwort kopiert");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Badge
                    variant={data.is_draft ? "outline" : "default"}
                    className={
                      data.is_draft
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : ""
                    }
                  >
                    {data.is_draft ? "Entwurf" : "Aktiv"}
                  </Badge>
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="mb-3 text-sm font-semibold">SIP-Zugangsdaten</h3>
              <div className="divide-y divide-border/60">
                <Row label="Telefonnummer" value={<span className="font-mono">{data.sip_phone_number}</span>} />
                <Row label="Server" value={<span className="font-mono">{data.sip_server}</span>} />
                <Row label="Benutzername" value={<span className="font-mono">{data.sip_username}</span>} />
                <Row
                  label="Passwort"
                  value={
                    data.sip_password ? (
                      <span className="font-mono">{"•".repeat(data.sip_password.length)}</span>
                    ) : null
                  }
                />
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
