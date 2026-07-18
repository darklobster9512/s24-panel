import { useMemo } from "react";
import { AlertCircle, CircleDot, CheckCircle2, Clock } from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Badge } from "@/components/ui/badge";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { MOCK_TICKETS, fmtRelative, type MockTicket } from "@/lib/mitarbeiter-mock";

const COLUMNS: { key: MockTicket["status"]; label: string; icon: typeof AlertCircle; tone: string }[] = [
  { key: "offen", label: "Offen", icon: AlertCircle, tone: "text-destructive" },
  { key: "in-bearbeitung", label: "In Bearbeitung", icon: CircleDot, tone: "text-amber-500" },
  { key: "erledigt", label: "Erledigt", icon: CheckCircle2, tone: "text-primary" },
];

export default function Tickets() {
  const { isAssigned, byId } = useAssignedClients();
  const tickets = useMemo(
    () => MOCK_TICKETS.filter((t) => isAssigned(t.clientId)),
    [isAssigned],
  );
  const grouped = useMemo(() => {
    const g: Record<string, MockTicket[]> = { offen: [], "in-bearbeitung": [], erledigt: [] };
    for (const t of tickets) g[t.status].push(t);
    return g;
  }, [tickets]);

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Offene Aufgaben aus Anrufen — z. B. Rückrufe oder Weiterleitungen."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = grouped[col.key] ?? [];
          return (
            <Panel
              key={col.key}
              title={
                <span className="inline-flex items-center gap-2">
                  <col.icon className={`h-4 w-4 ${col.tone}`} />
                  {col.label}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {list.length}
                  </span>
                </span>
              }
            >
              {list.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Keine Tickets.
                </div>
              ) : (
                <ul className="space-y-3">
                  {list.map((t) => {
                    const client = byId(t.clientId);
                    return (
                      <li
                        key={t.id}
                        className="cursor-pointer rounded-xl border border-border/60 bg-surface/40 p-3 transition hover:border-primary/40 hover:bg-surface/70"
                      >
                        <div className="flex items-start gap-2">
                          <ClientLogo logoUrl={client ? logoUrls[client.id] : undefined} name={client?.name ?? "?"} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{t.titel}</div>
                            <div className="truncate text-xs text-muted-foreground">{client?.name}</div>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-foreground/80">
                          {t.beschreibung}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <Badge
                            variant={t.prioritaet === "hoch" ? "destructive" : "secondary"}
                            className="text-[10px] capitalize"
                          >
                            {t.prioritaet}
                          </Badge>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {fmtRelative(t.createdAt)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
