import { DashboardShell, Panel, StatCard } from "@/components/DashboardShell";
import { PhoneCall, Clock, CheckCircle2, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const queue = [
  { line: "1", client: "Meier & Partner", waiting: "00:12", priority: "hoch" },
  { line: "2", client: "Zahnpraxis Nord", waiting: "00:38", priority: "normal" },
  { line: "3", client: "Beckmann Immobilien", waiting: "01:02", priority: "hoch" },
  { line: "4", client: "Café Sonne", waiting: "00:47", priority: "niedrig" },
];

export default function Mitarbeiter() {
  return (
    <DashboardShell
      title="Mitarbeiter Cockpit"
      subtitle="Ihre Warteschlange, Kunden und aktuellen Anrufe."
      badge="Mitarbeiter"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Status" value="Verfügbar" icon={<Headphones className="h-4 w-4" />} />
        <StatCard label="Anrufe heute" value="27" delta="+4 vs. gestern" icon={<PhoneCall className="h-4 w-4" />} />
        <StatCard label="Ø Gesprächszeit" value="3:12" delta="-0:18" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Abgeschlossen" value="22" delta="82% Quote" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Warteschlange"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Pause</Button>
                <Button size="sm">Nächster Anruf</Button>
              </div>
            }
          >
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-[60px_1fr_120px_120px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Linie</span><span>Kunde</span><span>Wartezeit</span><span>Priorität</span>
              </div>
              {queue.map((q) => (
                <div key={q.line} className="grid grid-cols-[60px_1fr_120px_120px] gap-4 py-3 text-sm">
                  <span className="font-mono">#{q.line}</span>
                  <span className="font-medium">{q.client}</span>
                  <span className="font-mono text-muted-foreground">{q.waiting}</span>
                  <Badge variant={q.priority === "hoch" ? "default" : "secondary"} className="w-fit capitalize">
                    {q.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Aktueller Anruf">
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-deep p-4 text-on-ink">
              <div className="text-xs text-white/60">Im Gespräch mit</div>
              <div className="mt-1 text-lg font-semibold">Herr Beckmann</div>
              <div className="mt-1 font-mono text-xs text-primary">02:14</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Kunde</div>
              <div className="mt-1 font-medium">Beckmann Immobilien</div>
              <div className="text-xs text-muted-foreground">Business · seit 2024</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Notiz</Button>
              <Button variant="outline" className="flex-1">Weiterleiten</Button>
            </div>
            <Button variant="destructive" className="w-full">Auflegen</Button>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Meine Statistik (Woche)">
          <div className="flex h-32 items-end gap-3">
            {[
              { d: "Mo", h: 60 },
              { d: "Di", h: 82 },
              { d: "Mi", h: 74 },
              { d: "Do", h: 92 },
              { d: "Fr", h: 68 },
              { d: "Sa", h: 30 },
              { d: "So", h: 12 },
            ].map((b) => (
              <div key={b.d} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${b.h}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{b.d}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
