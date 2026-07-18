import { useMemo, useState } from "react";
import { Search, Pencil, Clock } from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { MOCK_NOTES, fmtRelative } from "@/lib/mitarbeiter-mock";

const KATEGORIEN = ["Alle", "Rückruf", "Termin", "Info", "Beschwerde", "Weiterleitung"];

export default function Notizen() {
  const { isAssigned, byId, clients } = useAssignedClients();
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Alle");
  const [clientFilter, setClientFilter] = useState("alle");

  const notes = useMemo(() => {
    return MOCK_NOTES.filter((n) => isAssigned(n.clientId))
      .filter((n) => kat === "Alle" || n.kategorie === kat)
      .filter((n) => clientFilter === "alle" || n.clientId === clientFilter)
      .filter((n) => {
        if (!q.trim()) return true;
        const needle = q.toLowerCase();
        const client = byId(n.clientId);
        return [n.anruferName, n.anruferNummer, n.text, client?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [q, kat, clientFilter, isAssigned, byId]);

  return (
    <>
      <PageHeader
        title="Notizen"
        subtitle="Alle deine Call-Notizen zu zugewiesenen Kunden."
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Notizen durchsuchen…"
              className="h-9 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Select value={kat} onValueChange={setKat}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KATEGORIEN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Kunden</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {notes.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Keine Notizen gefunden.
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => {
              const client = byId(n.clientId);
              return (
                <li
                  key={n.id}
                  className="rounded-xl border border-border/60 bg-surface/40 p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <ClientLogo logoUrl={client ? logoUrls[client.id] : undefined} name={client?.name ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            · {n.anruferName} · <span className="font-mono">{n.anruferNummer}</span>
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {fmtRelative(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-foreground/90">{n.text}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{n.kategorie}</Badge>
                        {n.rueckrufGewuenscht && (
                          <Badge variant="outline" className="text-[10px]">
                            Rückruf {n.rueckrufZeit && `· ${n.rueckrufZeit}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
