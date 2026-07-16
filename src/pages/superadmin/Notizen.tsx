import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const notes = [
  {
    kunde: "Meier & Partner GmbH",
    agent: "Sofia W.",
    time: "16.07. 10:42",
    tags: ["Rückruf", "Angebot"],
    text: "Kunde möchte Angebot für Wartungsvertrag bis Freitag. Herr Meier direkt auf +49 30 12345 erreichbar.",
  },
  {
    kunde: "Beckmann Immobilien",
    agent: "Ömer K.",
    time: "16.07. 10:18",
    tags: ["Termin"],
    text: "Besichtigung am Donnerstag 14:00 in der Rosenstraße bestätigt. Interessent bringt Partner mit.",
  },
  {
    kunde: "Zahnpraxis Nord",
    agent: "Jan H.",
    time: "16.07. 10:31",
    tags: ["Terminverschiebung"],
    text: "Patientin verschiebt Kontrolltermin von Mittwoch auf nächste Woche Dienstag 09:30.",
  },
  {
    kunde: "Kanzlei Brandt & Söhne",
    agent: "Sofia W.",
    time: "16.07. 09:47",
    tags: ["Weiterleitung"],
    text: "Neuer Mandant Erbrecht — an Frau Dr. Brandt weitergeleitet, Rückruf zugesagt.",
  },
];

export default function Notizen() {
  return (
    <>
      <PageHeader
        title="Notizen"
        subtitle="Alle Call-Notizen der Mitarbeiter, durchsuchbar."
      />

      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Notizen durchsuchen…" className="h-9 pl-9" />
          </div>
        </div>

        <ul className="space-y-3">
          {notes.map((n, i) => (
            <li
              key={i}
              className="rounded-xl border border-border/60 bg-surface/50 p-4 transition hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{n.kunde}</span>
                  <span className="text-xs text-muted-foreground">· {n.agent}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{n.time}</span>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{n.text}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {n.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
