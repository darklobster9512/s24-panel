import { PageHeader, Panel, StatCard } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  PhoneCall,
  Ticket,
  Wallet,
  CheckCircle2,
  Clock,
} from "lucide-react";

const agents = [
  { name: "Sofia W.", state: "Verfügbar", calls: 24 },
  { name: "Jan H.", state: "Im Gespräch", calls: 19 },
  { name: "Lea M.", state: "Pause", calls: 12 },
  { name: "Ömer K.", state: "Verfügbar", calls: 31 },
];

const recentCalls = [
  { time: "10:42", kunde: "Meier & Partner", agent: "Sofia W.", dauer: "4:12", status: "beendet" },
  { time: "10:31", kunde: "Zahnpraxis Nord", agent: "Jan H.", dauer: "2:05", status: "beendet" },
  { time: "10:18", kunde: "Beckmann Immobilien", agent: "Ömer K.", dauer: "6:48", status: "beendet" },
  { time: "10:02", kunde: "Café Sonne", agent: "Lea M.", dauer: "1:22", status: "verpasst" },
];

export default function Overview() {
  return (
    <>
      <PageHeader
        title="Übersicht"
        subtitle="Alle Kunden, Mitarbeiter und Systemmetriken auf einen Blick."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Kunden" value="128" delta="+6 diese Woche" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Mitarbeiter" value="42" delta="+2 neu" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Anrufe heute" value="1.284" delta="+12%" icon={<PhoneCall className="h-4 w-4" />} />
        <StatCard label="Offene Tickets" value="17" delta="4 dringend" icon={<Ticket className="h-4 w-4" />} />
        <StatCard label="Offene Auszahlungen" value="€ 8.420" delta="6 Mitarbeiter" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Letzte Anrufe"
            action={<Button size="sm" variant="outline">Alle anzeigen</Button>}
          >
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-[70px_1fr_140px_80px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Uhrzeit</span>
                <span>Kunde</span>
                <span>Mitarbeiter</span>
                <span>Dauer</span>
                <span>Status</span>
              </div>
              {recentCalls.map((c, i) => (
                <div key={i} className="grid grid-cols-[70px_1fr_140px_80px_100px] gap-4 py-3 text-sm">
                  <span className="font-mono text-muted-foreground">{c.time}</span>
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
        </div>

        <Panel title="Mitarbeiter live">
          <ul className="space-y-3">
            {agents.map((a) => (
              <li key={a.name} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      a.state === "Verfügbar"
                        ? "bg-primary"
                        : a.state === "Im Gespräch"
                        ? "bg-amber-500"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.state}</div>
                  </div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{a.calls} calls</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel title="System-Ereignisse">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> Rollout Release v2.14 abgeschlossen</li>
            <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 text-muted-foreground" /> Backup automatisch geplant · 03:00 Uhr</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> Neuer Kunde Meier & Partner onboardet</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> 3 Mitarbeiter Auszahlungen freigegeben</li>
          </ul>
        </Panel>
        <Panel title="Umsatz (12 Monate)">
          <div className="flex h-40 items-end gap-2">
            {[40, 55, 48, 70, 62, 85, 92, 78, 96, 88, 100, 94].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Monatlicher Umsatz in T€</p>
        </Panel>
      </div>
    </>
  );
}
