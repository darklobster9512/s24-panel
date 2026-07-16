import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Mail } from "lucide-react";

const agents = [
  { name: "Sofia Weber", email: "sofia@sekreteriat24.de", clients: 4, calls: 128, contract: "Vollzeit", state: "Verfügbar" },
  { name: "Jan Hoffmann", email: "jan@sekreteriat24.de", clients: 3, calls: 96, contract: "Teilzeit", state: "Im Gespräch" },
  { name: "Lea Müller", email: "lea@sekreteriat24.de", clients: 5, calls: 142, contract: "Vollzeit", state: "Pause" },
  { name: "Ömer Kaya", email: "oemer@sekreteriat24.de", clients: 6, calls: 168, contract: "Vollzeit", state: "Verfügbar" },
  { name: "Nina Berger", email: "nina@sekreteriat24.de", clients: 2, calls: 54, contract: "Freelance", state: "Offline" },
];

export default function Mitarbeiter() {
  return (
    <>
      <PageHeader
        title="Mitarbeiter"
        subtitle="Team-Übersicht, Zuweisungen und Vertragsdaten."
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Mitarbeiter einladen
          </Button>
        }
      />

      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Mitarbeiter suchen…" className="h-9 pl-9" />
          </div>
          <Button variant="outline" size="sm">Filter</Button>
        </div>

        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[1.4fr_100px_80px_120px_120px_40px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Mitarbeiter</span>
            <span>Kunden</span>
            <span>Anrufe</span>
            <span>Vertrag</span>
            <span>Status</span>
            <span></span>
          </div>
          {agents.map((a) => (
            <div key={a.email} className="grid grid-cols-[1.4fr_100px_80px_120px_120px_40px] gap-4 py-3 text-sm items-center">
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {a.email}
                </div>
              </div>
              <span className="font-mono">{a.clients}</span>
              <span className="font-mono">{a.calls}</span>
              <span className="text-muted-foreground">{a.contract}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    a.state === "Verfügbar"
                      ? "bg-primary"
                      : a.state === "Im Gespräch"
                      ? "bg-amber-500"
                      : a.state === "Pause"
                      ? "bg-muted-foreground"
                      : "bg-border"
                  }`}
                />
                <span className="text-xs">{a.state}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
