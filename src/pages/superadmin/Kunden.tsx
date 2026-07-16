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
  company_name: string;
  industry: string;
  city: string;
  phone: string;
  email: string;
  forwarding_enabled: boolean;
  created_at: string;
}

export default function Kunden() {
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, industry, city, phone, email, forwarding_enabled, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter(
      (c) =>
        c.company_name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.city.toLowerCase().includes(needle) ||
        c.industry.toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="Kunden"
        subtitle="Alle Firmenkunden verwalten und neue Kunden anlegen."
        actions={
          <ClientCreateDialog>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Kunde anlegen
            </Button>
          </ClientCreateDialog>
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
              <span>Weiterleitung</span>
              <span></span>
            </div>
            {rows.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1.6fr_1fr_1fr_1fr_140px_40px] items-center gap-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.company_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                </div>
                <span className="truncate text-muted-foreground">{c.industry}</span>
                <span className="truncate">{c.city}</span>
                <span className="truncate font-mono text-xs">{c.phone}</span>
                <Badge
                  variant={c.forwarding_enabled ? "default" : "secondary"}
                  className="w-fit"
                >
                  {c.forwarding_enabled ? "aktiv" : "aus"}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
