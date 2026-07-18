import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneIncoming, Info, Radio } from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { MOCK_LIVE_CALLS, fmtDauer } from "@/lib/mitarbeiter-mock";

function useTicker() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

export default function LiveAnrufe() {
  useTicker();
  const { isAssigned, byId, logoUrls } = useAssignedClients();
  const calls = MOCK_LIVE_CALLS.filter((c) => isAssigned(c.clientId));

  return (
    <>
      <PageHeader
        title="Live-Anrufe"
        subtitle="Eingehende Anrufe für deine zugewiesenen Kunden — in Echtzeit."
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Radio className="h-3 w-3" /> Live (Mockup)
          </Badge>
        }
      />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-dashed border-border/60 bg-card/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Anrufe werden später über die sipgate Push-API automatisch erkannt und
          hier angezeigt. Aktuell sind das Demo-Daten. Nur Anrufe zu deinen
          zugewiesenen Kunden erscheinen in dieser Liste.
        </p>
      </div>

      {calls.length === 0 ? (
        <Panel>
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aktuell keine eingehenden Anrufe.
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {calls.map((call) => {
            const client = byId(call.clientId);
            const seconds = Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000);
            return (
              <div
                key={call.id}
                className="rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-card-elegant"
              >
                <div className="flex items-start gap-3">
                  <ClientLogo logoUrl={client ? logoUrls[client.id] : undefined} name={client?.name ?? "?"} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PhoneIncoming className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium uppercase tracking-wider text-primary">
                        Klingelt
                      </span>
                    </div>
                    <div className="mt-1 truncate font-semibold">{client?.name}</div>
                    <div className="text-xs text-muted-foreground">{client?.branche}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-semibold tabular-nums">
                      {fmtDauer(seconds)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Wartezeit
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface/60 p-3 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Anrufer
                    </div>
                    <div className="mt-0.5 font-medium">{call.anruferName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Nummer
                    </div>
                    <div className="mt-0.5 font-mono text-xs">{call.anruferNummer}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" className="flex-1 gap-2">
                    <Link to={`/mitarbeiter/erfassen?client=${client?.id}&call=${call.id}`}>
                      <PhoneIncoming className="h-4 w-4" /> Erfassen starten
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/mitarbeiter/kunden/${client?.id}`}>Kunde ansehen</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
