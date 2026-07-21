import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Phone,
  Mail,
  Globe,
  MapPin,
  ArrowRight,
  Building2,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";

function CardLogo({
  logoUrl,
  name,
}: {
  logoUrl?: string;
  name: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background sm:h-40 sm:w-40 lg:h-44 lg:w-44">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          className="h-full w-full object-contain p-3"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Building2 className="h-10 w-10 opacity-40" />
          <span className="mt-1 text-lg font-semibold">{initial}</span>
        </div>
      )}
    </div>
  );
}

export default function Kunden() {
  const { clients, logoUrls } = useAssignedClients();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((c) =>
      [
        c.name,
        c.branche ?? "",
        c.telefon ?? "",
        c.email ?? "",
        c.website ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [clients, q]);

  return (
    <>
      <PageHeader
        title="Meine Kunden"
        subtitle="Alle dir zugewiesenen Kunden auf einen Blick."
      />

      <Panel>
        <div className="mb-5 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kunden suchen…"
              className="h-10 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Dir wurden noch keine Kunden zugewiesen.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Keine Kunden gefunden.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/mitarbeiter/kunden/${c.id}`}
                className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface/40 p-4 transition hover:border-primary/40 hover:bg-surface/70 sm:flex-row sm:items-stretch"
              >
                {/* Logo-Spalte */}
                <CardLogo logoUrl={logoUrls[c.id]} name={c.name} />

                {/* Info-Spalte */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold tracking-tight">
                          {c.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {c.branche ?? "—"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {c.weiterleitung ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-primary/15 text-ink hover:bg-primary/25"
                          >
                            Weiterleitung aktiv
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Nur Notiz
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                      {c.telefon && (
                        <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          {c.telefon}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.website && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{c.website}</span>
                        </div>
                      )}
                      {c.adresse && c.adresse !== "," && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{c.adresse}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {c.firmeninhalt && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">
                      {c.firmeninhalt}
                    </p>
                  )}
                </div>

                {/* Aktionen-Spalte */}
                <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-100 transition group-hover:translate-x-0.5 sm:opacity-0 sm:group-hover:opacity-100">
                    Details <ArrowRight className="h-4 w-4" />
                  </span>
                  <div className="flex gap-2">
                    {c.ansprechpartner && (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        AP: {c.ansprechpartner}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
