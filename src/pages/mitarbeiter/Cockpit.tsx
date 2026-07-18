import { Link } from "react-router-dom";
import { PhoneCall, Clock, StickyNote, Users, PhoneMissed, PhoneIncoming } from "lucide-react";
import { PageHeader, Panel, StatCard, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { MOCK_RECENT_CALLS, fmtRelative, fmtDauer, CURRENT_EMPLOYEE } from "@/lib/mitarbeiter-mock";

export default function Cockpit() {
  const { clients, isAssigned } = useAssignedClients();
  const recent = MOCK_RECENT_CALLS.filter((c) => isAssigned(c.clientId)).slice(0, 6);

  return (
    <>
      <PageHeader
        title={`Willkommen, ${CURRENT_EMPLOYEE.name.split(" ")[0]}`}
        subtitle="Übersicht über deine Kunden, Anrufe und offenen Aufgaben."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Anrufe heute" value="14" delta="+3 vs. gestern" icon={<PhoneCall className="h-4 w-4" />} />
        <StatCard label="Ø Gesprächszeit" value="2:48" delta="-0:12" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Offene Notizen" value="3" icon={<StickyNote className="h-4 w-4" />} />
        <StatCard label="Zugewiesene Kunden" value={String(clients.length)} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Letzte Anrufe"
            action={
              <Link to="/mitarbeiter/live" className="text-xs font-medium text-primary hover:underline">
                Live-Ansicht →
              </Link>
            }
          >
            {recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Keine Anrufe.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recent.map((call) => {
                  const client = clients.find((c) => c.id === call.clientId);
                  const missed = call.status === "verpasst";
                  return (
                    <li key={call.id} className="flex items-center gap-3 py-3">
                      <ClientLogo logo={client?.logo} name={client?.name ?? "?"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{call.anruferName}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {call.anruferNummer}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client?.name} · {fmtRelative(call.startedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {missed ? (
                          <Badge variant="destructive" className="gap-1">
                            <PhoneMissed className="h-3 w-3" /> Verpasst
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <PhoneIncoming className="h-3 w-3" /> {fmtDauer(call.dauerSek)}
                          </Badge>
                        )}
                        {call.kategorie && (
                          <Badge variant="outline">{call.kategorie}</Badge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title="Meine Kunden"
          action={
            <Link to="/mitarbeiter/kunden" className="text-xs font-medium text-primary hover:underline">
              Alle →
            </Link>
          }
        >
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/mitarbeiter/kunden/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-border/60 hover:bg-surface/60"
                >
                  <ClientLogo logo={c.logo} name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.branche}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Hinweis:</span> Softphone
        (Phonerlite) läuft lokal. Anrufe werden später über die sipgate Push-API
        automatisch hier angezeigt — aktuell Mockup-Daten.
      </div>
    </>
  );
}
