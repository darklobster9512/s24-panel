import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, User, PhoneForwarded, PhoneCall, PhoneMissed, PhoneIncoming } from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { MOCK_RECENT_CALLS, MOCK_NOTES, fmtRelative, fmtDauer } from "@/lib/mitarbeiter-mock";

export default function KundeDetail() {
  const { id } = useParams<{ id: string }>();
  const { byId, logoUrls, loading } = useAssignedClients();
  const client = id ? byId(id) : undefined;

  if (loading) return null;
  if (!client) return <Navigate to="/mitarbeiter/kunden" replace />;

  const calls = MOCK_RECENT_CALLS.filter((c) => c.clientId === client.id);
  const notes = MOCK_NOTES.filter((n) => n.clientId === client.id);
  

  return (
    <>
      <Link
        to="/mitarbeiter/kunden"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zu Kunden
      </Link>

      <PageHeader
        title={client.name}
        subtitle={client.branche ?? undefined}
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link to={`/mitarbeiter/erfassen?client=${client.id}`}>
              <PhoneCall className="h-4 w-4" /> Anruf für diesen Kunden erfassen
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Firmeninhalt">
            <div className="flex items-start gap-4">
              <ClientLogo logoUrl={logoUrls[client.id]} name={client.name} size="lg" />
              <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                {client.firmeninhalt}
              </p>
            </div>
          </Panel>

          <Panel title="Begrüßungstext">
            <div className="rounded-xl bg-ink-deep p-4 font-mono text-sm text-on-ink">
              „{client.begruessung}"
            </div>
          </Panel>

          <Panel title="Letzte Anrufe">
            {calls.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Keine Anrufe.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {calls.map((call) => {
                  const missed = call.status === "verpasst";
                  return (
                    <li key={call.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{call.anruferName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{call.anruferNummer}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{fmtRelative(call.startedAt)}</div>
                      </div>
                      {missed ? (
                        <Badge variant="destructive" className="gap-1">
                          <PhoneMissed className="h-3 w-3" /> Verpasst
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <PhoneIncoming className="h-3 w-3" /> {fmtDauer(call.dauerSek)}
                        </Badge>
                      )}
                      {call.kategorie && <Badge variant="outline">{call.kategorie}</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Notizen">
            {notes.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Keine Notizen.</div>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-border/60 bg-surface/40 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{n.anruferName} · <span className="font-mono">{n.anruferNummer}</span></span>
                      <span>{fmtRelative(n.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm">{n.text}</p>
                    <Badge variant="secondary" className="mt-2 text-[10px]">{n.kategorie}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Kontakt">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Telefon</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {client.telefon}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Adresse</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {client.adresse}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Ansprechpartner</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> {client.ansprechpartner}
                </dd>
                <dd className="ml-5 mt-0.5 font-mono text-xs text-muted-foreground">
                  {client.ansprechpartnerTel}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Weiterleitung">
            {client.weiterleitung ? (
              <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-3">
                <PhoneForwarded className="mt-0.5 h-4 w-4 text-ink" />
                <div>
                  <div className="text-sm font-medium">Aktiv</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Anrufe werden nach Rückfrage weitergeleitet.
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 p-3 text-sm text-muted-foreground">
                Keine Weiterleitung — Notiz aufnehmen.
              </div>
            )}
          </Panel>

        </div>
      </div>
    </>
  );
}
