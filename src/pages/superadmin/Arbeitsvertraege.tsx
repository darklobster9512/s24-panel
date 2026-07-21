import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileSignature, Loader2, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  status: "pending_employee" | "pending_admin" | "completed";
  signed_at: string | null;
  admin_confirmed_at: string | null;
  employee: { id: string; first_name: string | null; last_name: string | null; login_email: string | null } | null;
  template: { id: string; title: string } | null;
};

const STATUS_LABELS: Record<Row["status"], string> = {
  pending_employee: "Wartet auf Mitarbeiter",
  pending_admin: "Wartet auf Bestätigung",
  completed: "Abgeschlossen",
};

const STATUS_VARIANTS: Record<Row["status"], string> = {
  pending_employee: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  pending_admin: "bg-primary/15 text-ink-deep border-primary/40",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
};

export default function Arbeitsvertraege() {
  const q = useQuery({
    queryKey: ["employee-contracts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employee_contracts")
        .select(
          "id, status, signed_at, admin_confirmed_at, employee:employees(id, first_name, last_name, login_email), template:contract_templates(id, title)",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <>
      <PageHeader
        title="Arbeitsverträge"
        subtitle="Alle zugewiesenen und unterzeichneten Arbeitsverträge auf einen Blick."
      />

      <Panel>
        {q.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade…
          </div>
        ) : q.isError ? (
          <div className="py-8 text-center text-sm text-destructive">
            {(q.error as Error).message}
          </div>
        ) : !q.data || q.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-10 text-center">
            <FileSignature className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Noch keine Arbeitsverträge zugewiesen. Weise einem Mitarbeiter eine Vorlage im
              Mitarbeiter-Wizard zu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {q.data.map((r) => {
              const name = [r.employee?.first_name, r.employee?.last_name]
                .filter(Boolean)
                .join(" ") || "—";
              return (
                <Link
                  key={r.id}
                  to={`/superadmin/arbeitsvertraege/${r.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                    <FileSignature className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{name}</span>
                      <Badge variant="outline" className={STATUS_VARIANTS[r.status]}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {r.template?.title ?? "—"} · {r.employee?.login_email ?? "—"}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
