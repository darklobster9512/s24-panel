import {
  DashboardShell,
  Panel,
  StatCard,
} from "@/components/DashboardShell";
import {
  Users,
  Building2,
  PhoneCall,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const clients = [
  { name: "Meier & Partner GmbH", plan: "Business", calls: 128, status: "aktiv" },
  { name: "Zahnpraxis Nord", plan: "Starter", calls: 42, status: "aktiv" },
  { name: "Beckmann Immobilien", plan: "Enterprise", calls: 356, status: "aktiv" },
  { name: "Café Sonne", plan: "Starter", calls: 8, status: "pausiert" },
];

const agents = [
  { name: "Sofia W.", state: "Verfügbar", calls: 24 },
  { name: "Jan H.", state: "Im Gespräch", calls: 19 },
  { name: "Lea M.", state: "Pause", calls: 12 },
  { name: "Ömer K.", state: "Verfügbar", calls: 31 },
];

export default function Superadmin() {
  return (
    <DashboardShell
      title="Superadmin Dashboard"
      subtitle="Alle Kunden, Mitarbeiter und Systemmetriken auf einen Blick."
      badge="Superadmin"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Kunden" value="128" delta="+6 diese Woche" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Mitarbeiter" value="42" delta="+2 neu" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Anrufe heute" value="1.284" delta="+12%" icon={<PhoneCall className="h-4 w-4" />} />
        <StatCard label="Uptime" value="99,98%" delta="30 Tage" icon={<Activity className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Kunden"
            action={<Button size="sm" variant="outline">Alle anzeigen</Button>}
          >
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-[1fr_120px_100px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Kunde</span><span>Plan</span><span>Anrufe</span><span>Status</span>
              </div>
              {clients.map((c) => (
                <div key={c.name} className="grid grid-cols-[1fr_120px_100px_100px] gap-4 py-3 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.plan}</span>
                  <span className="font-mono">{c.calls}</span>
                  <Badge variant={c.status === "aktiv" ? "default" : "secondary"} className="w-fit capitalize">
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
                  <span className={`h-2 w-2 rounded-full ${a.state === "Verfügbar" ? "bg-primary" : a.state === "Im Gespräch" ? "bg-amber-500" : "bg-muted-foreground"}`} />
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
          </ul>
        </Panel>
        <Panel title="Umsatz (Mockup)">
          <div className="flex h-40 items-end gap-2">
            {[40, 55, 48, 70, 62, 85, 92, 78, 96, 88, 100, 94].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">12-Monats-Übersicht</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}
