import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MapPin,
  User,
  PhoneForwarded,
  PhoneCall,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  FileText,
  ChevronDown,
} from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { useClientDetailData } from "@/hooks/use-client-detail-data";
import { renderCallScript } from "@/lib/call-script-vars";
import { fmtRelative, fmtDauer } from "@/lib/mitarbeiter-mock";

export default function KundeDetail() {
  const { id } = useParams<{ id: string }>();
  const { byId, logoUrls } = useAssignedClients();
  const client = id ? byId(id) : undefined;

  if (!client) return <Navigate to="/mitarbeiter/kunden" replace />;

  return <KundeDetailInner client={client} logoUrl={logoUrls[client.id]} />;
}

function KundeDetailInner({
  client,
  logoUrl,
}: {
  client: NonNullable<ReturnType<ReturnType<typeof useAssignedClients>["byId"]>>;
  logoUrl?: string;
}) {
  const { calls, notes } = useClientDetailData(client.id);
  const [scriptOpen, setScriptOpen] = useState(false);
  const isRecruitment = client.istRecruitment;

  const renderedScript = useMemo(() => {
    if (!client.callSkript) return "";
    return renderCallScript(client.callSkript, {
      Mein_Name: client.skriptMeinName,
      Firmenname: client.skriptFirmenname,
    });
  }, [client.callSkript, client.skriptMeinName, client.skriptFirmenname]);

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
          <div className="flex items-center gap-2">
            {isRecruitment && (
              <Badge variant="secondary" className="gap-1 bg-primary/15 text-ink hover:bg-primary/25">
                <PhoneOutgoing className="h-3 w-3" /> Recruitment-Kunde
              </Badge>
            )}
            <Button asChild size="sm" className="gap-2">
              <Link to={`/mitarbeiter/erfassen?client=${client.id}`}>
                <PhoneCall className="h-4 w-4" />
                {isRecruitment ? "Recruiting-Anruf starten" : "Anruf für diesen Kunden erfassen"}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Firmeninhalt">
            <div className="flex items-start gap-4">
              <ClientLogo logoUrl={logoUrl} name={client.name} size="lg" />
              <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                {client.firmeninhalt || "—"}
              </p>
            </div>
          </Panel>

          {isRecruitment ? (
            <Panel
              title="Call-Skript"
              action={
                client.callSkript ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setScriptOpen((v) => !v)}
                  >
                    <FileText className="h-4 w-4" />
                    {scriptOpen ? "Einklappen" : "Anzeigen"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${scriptOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                ) : undefined
              }
            >
              {!client.callSkript ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  Für diesen Kunden ist noch kein Call-Skript hinterlegt.
                </div>
              ) : scriptOpen ? (
                <div
                  className="rich-text prose prose-sm max-w-none [&_h1]:mt-0 [&_h2]:mt-6 [&_h2]:text-primary"
                  dangerouslySetInnerHTML={{ __html: renderedScript }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Skript ist hinterlegt — zum Lesen aufklappen. Variablen wie{" "}
                  <code className="rounded bg-muted px-1">[Bewerber_Name]</code> werden im Anruf
                  automatisch gefüllt.
                </p>
              )}
            </Panel>
          ) : (
            <Panel title="Begrüßungstext">
              <div className="rounded-xl bg-ink-deep p-4 font-mono text-sm text-on-ink">
                „{client.begruessung || "—"}"
              </div>
            </Panel>
          )}

          {!isRecruitment && (
            <Panel title="Letzte Anrufe">
              {calls.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Keine Anrufe.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {calls.map((call) => {
                    const missed = call.status === "missed" || call.status === "verpasst";
                    return (
                      <li key={call.id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{call.caller_name || "Unbekannt"}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {call.from_number ?? "—"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {fmtRelative(call.started_at)}
                          </div>
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
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          )}

          <Panel title={isRecruitment ? "Gesprächsnotizen" : "Notizen"}>
            {notes.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Keine Notizen.</div>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-border/60 bg-surface/40 p-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="min-w-0 truncate">
                        {n.anrufer_name || "Unbekannt"} ·{" "}
                        <span className="font-mono">{n.anrufer_nummer ?? "—"}</span>
                      </span>
                      <span className="shrink-0">{fmtRelative(n.created_at)}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm">{n.anliegen}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {n.kategorie && (
                        <Badge variant="secondary" className="text-[10px]">
                          {n.kategorie}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        Priorität: {n.prioritaet}
                      </Badge>
                      {n.dauer_sekunden > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {fmtDauer(n.dauer_sekunden)}
                        </Badge>
                      )}
                    </div>
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
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {client.telefon ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Adresse</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {client.adresse || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Ansprechpartner
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  {client.ansprechpartner ?? "—"}
                </dd>
                <dd className="ml-5 mt-0.5 font-mono text-xs text-muted-foreground">
                  {client.ansprechpartnerTel ?? ""}
                </dd>
              </div>
            </dl>
          </Panel>

          {isRecruitment ? (
            <Panel title="Anruf-Modus">
              <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-3">
                <PhoneOutgoing className="mt-0.5 h-4 w-4 text-ink" />
                <div>
                  <div className="text-sm font-medium">Outbound / Recruiting</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Gesprächsnotizen werden direkt beim Bewerbungsgespräch erfasst.
                  </div>
                </div>
              </div>
            </Panel>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
