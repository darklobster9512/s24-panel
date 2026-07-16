import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";

const calls = [
  { time: "16.07. 10:42", kunde: "Meier & Partner", agent: "Sofia W.", dauer: "4:12", direction: "in", status: "beendet" },
  { time: "16.07. 10:31", kunde: "Zahnpraxis Nord", agent: "Jan H.", dauer: "2:05", direction: "in", status: "beendet" },
  { time: "16.07. 10:18", kunde: "Beckmann Immobilien", agent: "Ömer K.", dauer: "6:48", direction: "out", status: "beendet" },
  { time: "16.07. 10:02", kunde: "Café Sonne", agent: "Lea M.", dauer: "0:00", direction: "in", status: "verpasst" },
  { time: "16.07. 09:47", kunde: "Kanzlei Brandt", agent: "Sofia W.", dauer: "3:22", direction: "in", status: "beendet" },
  { time: "16.07. 09:31", kunde: "Fitness Kraftwerk", agent: "Ömer K.", dauer: "1:54", direction: "out", status: "beendet" },
];

function DirIcon({ d }: { d: string }) {
  if (d === "in") return <PhoneIncoming className="h-4 w-4 text-primary" />;
  if (d === "out") return <PhoneOutgoing className="h-4 w-4 text-ink" />;
  return <PhoneMissed className="h-4 w-4 text-destructive" />;
}

export default function Anrufe() {
  return (
    <>
      <PageHeader
        title="Anrufe"
        subtitle="Globales Anruf-Log über alle Kunden und Mitarbeiter."
        actions={<Button size="sm" variant="outline">Export CSV</Button>}
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Nummer, Kunde, Mitarbeiter…" className="h-9 pl-9" />
          </div>
          <Button variant="outline" size="sm">Zeitraum</Button>
          <Button variant="outline" size="sm">Kunde</Button>
          <Button variant="outline" size="sm">Mitarbeiter</Button>
          <Button variant="outline" size="sm">Richtung</Button>
        </div>

        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[130px_40px_1fr_140px_80px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Zeit</span>
            <span></span>
            <span>Kunde</span>
            <span>Mitarbeiter</span>
            <span>Dauer</span>
            <span>Status</span>
          </div>
          {calls.map((c, i) => (
            <div key={i} className="grid grid-cols-[130px_40px_1fr_140px_80px_100px] gap-4 py-3 text-sm items-center">
              <span className="font-mono text-xs text-muted-foreground">{c.time}</span>
              <DirIcon d={c.direction === "in" && c.status === "verpasst" ? "missed" : c.direction} />
              <span className="font-medium">{c.kunde}</span>
              <span className="text-muted-foreground">{c.agent}</span>
              <span className="font-mono">{c.dauer}</span>
              <Badge variant={c.status === "beendet" ? "default" : "destructive"} className="w-fit capitalize">
                {c.status}
              </Badge>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
