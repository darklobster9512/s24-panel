import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Phone, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";

export default function Kunden() {
  const { clients, logoUrls, loading, error } = useAssignedClients();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((c) =>
      [c.name, c.branche ?? "", c.telefon ?? ""].join(" ").toLowerCase().includes(needle),
    );
  }, [clients, q]);

  return (
    <>
      <PageHeader
        title="Meine Kunden"
        subtitle="Alle dir zugewiesenen Kunden auf einen Blick."
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

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-destructive">
            Fehler beim Laden: {error}
          </div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Dir wurden noch keine Kunden zugewiesen.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Keine Kunden gefunden.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/mitarbeiter/kunden/${c.id}`}
                className="group rounded-2xl border border-border/60 bg-surface/40 p-4 transition hover:border-primary/40 hover:bg-surface/70"
              >
                <div className="flex items-start gap-3">
                  <ClientLogo logoUrl={logoUrls[c.id]} name={c.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.branche ?? "—"}</div>
                    {c.telefon && (
                      <div className="mt-2 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {c.telefon}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                  {c.weiterleitung ? (
                    <Badge variant="secondary" className="text-[10px]">Weiterleitung aktiv</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Nur Notiz</Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Öffnen <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
