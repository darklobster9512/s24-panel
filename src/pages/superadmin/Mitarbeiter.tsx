import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface EmployeeRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  login_email: string | null;
  contract_type: string | null;
  start_date: string | null;
  is_draft: boolean;
  user_id: string | null;
}

export default function Mitarbeiter() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employees"],
    queryFn: async (): Promise<EmployeeRow[]> => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, login_email, contract_type, start_date, is_draft, user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EmployeeRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (row: EmployeeRow) => {
      if (row.user_id) {
        const { data, error } = await supabase.functions.invoke(
          "delete-employee-account",
          { body: { employee_id: row.id } },
        );
        if (error) throw new Error(error.message);
        if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      } else {
        const { error } = await supabase.from("employees").delete().eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Mitarbeiter gelöscht");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((e) =>
      [`${e.first_name ?? ""} ${e.last_name ?? ""}`, e.login_email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="Mitarbeiter"
        subtitle="Team-Übersicht und Panel-Zugänge verwalten."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link to="/superadmin/mitarbeiter/anlegen">
              <Plus className="h-4 w-4" /> Mitarbeiter anlegen
            </Link>
          </Button>
        }
      />

      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Mitarbeiter suchen…"
              className="h-9 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Mitarbeiter…
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-destructive">
            Fehler: {(error as Error).message}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {q ? "Keine Mitarbeiter gefunden." : "Noch keine Mitarbeiter."}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="grid grid-cols-[1.4fr_1.4fr_120px_120px_120px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Mitarbeiter</span>
              <span>Login</span>
              <span>Vertrag</span>
              <span>Start</span>
              <span>Status</span>
              <span></span>
            </div>
            {rows.map((e) => {
              const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim();
              return (
                <div
                  key={e.id}
                  className="grid grid-cols-[1.4fr_1.4fr_120px_120px_120px_100px] items-center gap-4 py-3 text-sm"
                >
                  <div className="min-w-0 truncate font-medium">
                    {name || <span className="italic text-muted-foreground">Unbenannter Entwurf</span>}
                  </div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {e.login_email ?? "—"}
                  </div>
                  <span className="capitalize text-muted-foreground">{e.contract_type ?? "—"}</span>
                  <span className="font-mono text-xs">{e.start_date ?? "—"}</span>
                  <Badge
                    variant={e.is_draft ? "outline" : "default"}
                    className={
                      e.is_draft
                        ? "w-fit border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "w-fit"
                    }
                  >
                    {e.is_draft ? "Entwurf" : "Aktiv"}
                  </Badge>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link to={`/superadmin/mitarbeiter/${e.id}`} aria-label="Details">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link to={`/superadmin/mitarbeiter/bearbeiten/${e.id}`} aria-label="Bearbeiten">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`"${name || e.login_email}" wirklich löschen?`)) {
                          del.mutate(e);
                        }
                      }}
                      disabled={del.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
