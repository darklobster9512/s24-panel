import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download, FileSignature } from "lucide-react";
import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useMyContract } from "@/hooks/use-my-contract";

interface EmployeeRow {
  first_name: string | null;
  last_name: string | null;
  login_email: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  contract_type: string | null;
  start_date: string | null;
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
          "first_name, last_name, login_email, personal_email, personal_phone, contract_type, start_date",
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) toast.error("Mitarbeiterdaten konnten nicht geladen werden");
      setEmployee((data as EmployeeRow | null) ?? null);
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
      <PageHeader title="Profil & Vertrag" subtitle="Deine Stammdaten und Vertragsinformationen." />

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
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
        </div>
      )}
    </>
  );
}
