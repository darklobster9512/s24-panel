import { DashboardShell, Panel, StatCard } from "@/components/DashboardShell";
import { PhoneCall, MessageSquare, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const calls = [
  { time: "09:12", from: "+49 30 55512345", topic: "Terminvereinbarung", status: "beantwortet" },
  { time: "09:47", from: "+49 89 44499812", topic: "Rückfrage Rechnung", status: "weitergeleitet" },
  { time: "10:03", from: "+49 40 998877", topic: "Angebot Reinigung", status: "beantwortet" },
  { time: "10:31", from: "+49 221 664422", topic: "Reklamation", status: "in Bearbeitung" },
];

export default function Kunde() {
  return (
    <DashboardShell
      title="Guten Tag 👋"
      subtitle="Ihr persönliches Sekretariat — heute für Sie im Einsatz."
      badge="Kunde"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Anrufe heute" value="18" delta="+3 vs. gestern" icon={<PhoneCall className="h-4 w-4" />} />
        <StatCard label="Nachrichten" value="7" delta="2 neu" icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard label="Ø Reaktionszeit" value="42s" delta="-8s" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Zufriedenheit" value="4.9 / 5" delta="+0.2" icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Letzte Anrufe"
            action={<Button size="sm" variant="outline">Alle Anrufe</Button>}
          >
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-[80px_1fr_1fr_140px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Zeit</span><span>Anrufer</span><span>Thema</span><span>Status</span>
              </div>
              {calls.map((c) => (
                <div key={c.time} className="grid grid-cols-[80px_1fr_1fr_140px] gap-4 py-3 text-sm">
                  <span className="font-mono text-muted-foreground">{c.time}</span>
                  <span className="font-mono">{c.from}</span>
                  <span>{c.topic}</span>
                  <Badge variant="secondary" className="w-fit">{c.status}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Ihr Paket">
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Aktuelles Paket</div>
              <div className="mt-1 text-2xl font-semibold">Business</div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Anrufe-Kontingent</span>
                <span className="font-mono">184 / 300</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: "61%" }} />
              </div>
            </div>
            <Button className="w-full">Paket upgraden</Button>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel title="Aufgaben">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <input type="checkbox" className="accent-primary" defaultChecked />
              <span className="line-through text-muted-foreground">Rückruf Fr. Beckmann</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <input type="checkbox" className="accent-primary" />
              <span>Angebot an Meier senden</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <input type="checkbox" className="accent-primary" />
              <span>Termin bestätigen · Mi 14:00</span>
            </li>
          </ul>
        </Panel>
        <Panel title="Rechnungen">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <span>Oktober 2026</span>
              <Badge>bezahlt</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <span>September 2026</span>
              <Badge>bezahlt</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <span>August 2026</span>
              <Badge>bezahlt</Badge>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
