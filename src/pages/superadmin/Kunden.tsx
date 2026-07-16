import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal } from "lucide-react";

const clients = [
  { name: "Meier & Partner GmbH", plan: "Business", agents: 3, calls: 128, status: "aktiv" },
  { name: "Zahnpraxis Nord", plan: "Starter", agents: 1, calls: 42, status: "aktiv" },
  { name: "Beckmann Immobilien", plan: "Enterprise", agents: 5, calls: 356, status: "aktiv" },
  { name: "Café Sonne", plan: "Starter", agents: 1, calls: 8, status: "pausiert" },
  { name: "Kanzlei Brandt & Söhne", plan: "Business", agents: 2, calls: 94, status: "aktiv" },
  { name: "Fitness Studio Kraftwerk", plan: "Starter", agents: 1, calls: 21, status: "aktiv" },
];

export default function Kunden() {
  return (
    <>
      <PageHeader
        title="Kunden"
        subtitle="Alle Firmenkunden verwalten und neue Kunden anlegen."
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Kunde anlegen
          </Button>
        }
      />

      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Kunden suchen…" className="h-9 pl-9" />
          </div>
          <Button variant="outline" size="sm">Filter</Button>
          <Button variant="outline" size="sm">Export</Button>
        </div>

        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[1fr_120px_120px_100px_100px_40px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Kunde</span>
            <span>Plan</span>
            <span>Mitarbeiter</span>
            <span>Anrufe</span>
            <span>Status</span>
            <span></span>
          </div>
          {clients.map((c) => (
            <div key={c.name} className="grid grid-cols-[1fr_120px_120px_100px_100px_40px] gap-4 py-3 text-sm items-center">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">{c.plan}</span>
              <span className="font-mono">{c.agents}</span>
              <span className="font-mono">{c.calls}</span>
              <Badge variant={c.status === "aktiv" ? "default" : "secondary"} className="w-fit capitalize">
                {c.status}
              </Badge>
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
