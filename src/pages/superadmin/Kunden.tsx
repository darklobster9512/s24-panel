import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Pencil, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ClientRow {
  id: string;
  company_name: string | null;
  industry: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  forwarding_enabled: boolean;
  is_draft: boolean;
  created_at: string;
}

export default function Kunden() {
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, industry, city, phone, email, forwarding_enabled, is_draft, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientRow[];
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter(
      (c) =>
        (c.company_name ?? "").toLowerCase().includes(needle) ||
        (c.email ?? "").toLowerCase().includes(needle) ||
        (c.city ?? "").toLowerCase().includes(needle) ||
        (c.industry ?? "").toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="Kunden"
        subtitle="Alle Firmenkunden verwalten und neue Kunden anlegen."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link to="/superadmin/kunden/anlegen">
              <Plus className="h-4 w-4" /> Kunde anlegen
            </Link>
          </Button>
        }
      />

      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kunden suchen…"
              className="h-9 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Kunden…
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-destructive">
            Fehler: {(error as Error).message}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {q ? "Keine Kunden gefunden." : "Noch keine Kunden. Legen Sie den ersten an."}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_140px_40px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Kunde</span>
              <span>Branche</span>
              <span>Stadt</span>
              <span>Telefon</span>
              <span>Status</span>
              <span></span>
            </div>
            {rows.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1.6fr_1fr_1fr_1fr_140px_40px] items-center gap-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {c.company_name || <span className="text-muted-foreground italic">Unbenannter Entwurf</span>}
                    </span>
                    {c.is_draft && (
                      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Entwurf
                      </Badge>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{c.email ?? "—"}</div>
                </div>
                <span className="truncate text-muted-foreground">{c.industry ?? "—"}</span>
                <span className="truncate">{c.city ?? "—"}</span>
                <span className="truncate font-mono text-xs">{c.phone ?? "—"}</span>
                <Badge
                  variant={c.forwarding_enabled ? "default" : "secondary"}
                  className="w-fit"
                >
                  {c.is_draft ? "—" : c.forwarding_enabled ? "Weiterleitung aktiv" : "Weiterleitung aus"}
                </Badge>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <Link to={`/superadmin/kunden/bearbeiten/${c.id}`} aria-label="Bearbeiten">
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
