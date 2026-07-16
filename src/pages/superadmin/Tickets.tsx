import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

type Ticket = {
  id: string;
  title: string;
  from: string;
  fromType: "Kunde" | "Mitarbeiter";
  status: "Neu" | "In Bearbeitung" | "Wartet" | "Erledigt";
  priority: "niedrig" | "mittel" | "hoch";
  updated: string;
};

const tickets: Ticket[] = [
  { id: "T-1042", title: "Anrufweiterleitung funktioniert nicht", from: "Meier & Partner GmbH", fromType: "Kunde", status: "Neu", priority: "hoch", updated: "vor 10 Min" },
  { id: "T-1041", title: "Neuer Sprachbaustein gewünscht", from: "Zahnpraxis Nord", fromType: "Kunde", status: "In Bearbeitung", priority: "mittel", updated: "vor 2 Std" },
  { id: "T-1040", title: "Zugangsdaten für neues Tool", from: "Sofia Weber", fromType: "Mitarbeiter", status: "Wartet", priority: "niedrig", updated: "gestern" },
  { id: "T-1039", title: "Headset defekt — Ersatz nötig", from: "Ömer Kaya", fromType: "Mitarbeiter", status: "In Bearbeitung", priority: "mittel", updated: "gestern" },
  { id: "T-1038", title: "Rechnung Juni Klärung", from: "Beckmann Immobilien", fromType: "Kunde", status: "Erledigt", priority: "niedrig", updated: "vor 3 Tagen" },
];

const statusVariant: Record<Ticket["status"], "default" | "secondary" | "outline" | "destructive"> = {
  "Neu": "destructive",
  "In Bearbeitung": "default",
  "Wartet": "secondary",
  "Erledigt": "outline",
};

function TicketTable({ items }: { items: Ticket[] }) {
  return (
    <div className="divide-y divide-border/60">
      <div className="grid grid-cols-[80px_1fr_180px_130px_120px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>ID</span>
        <span>Titel</span>
        <span>Von</span>
        <span>Status</span>
        <span>Priorität</span>
        <span>Aktualisiert</span>
      </div>
      {items.map((t) => (
        <div key={t.id} className="grid grid-cols-[80px_1fr_180px_130px_120px_100px] gap-4 py-3 text-sm items-center">
          <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
          <span className="font-medium">{t.title}</span>
          <div>
            <div className="text-sm">{t.from}</div>
            <div className="text-xs text-muted-foreground">{t.fromType}</div>
          </div>
          <Badge variant={statusVariant[t.status]} className="w-fit">{t.status}</Badge>
          <span className={`text-xs font-medium capitalize ${t.priority === "hoch" ? "text-destructive" : t.priority === "mittel" ? "text-amber-600" : "text-muted-foreground"}`}>
            {t.priority}
          </span>
          <span className="text-xs text-muted-foreground">{t.updated}</span>
        </div>
      ))}
    </div>
  );
}

export default function Tickets() {
  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Anfragen von Kunden und Mitarbeitern zentral verwalten."
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Ticket anlegen
          </Button>
        }
      />

      <Panel>
        <Tabs defaultValue="alle">
          <TabsList>
            <TabsTrigger value="alle">Alle ({tickets.length})</TabsTrigger>
            <TabsTrigger value="kunden">Kunden ({tickets.filter(t => t.fromType === "Kunde").length})</TabsTrigger>
            <TabsTrigger value="mitarbeiter">Mitarbeiter ({tickets.filter(t => t.fromType === "Mitarbeiter").length})</TabsTrigger>
          </TabsList>
          <TabsContent value="alle" className="mt-4">
            <TicketTable items={tickets} />
          </TabsContent>
          <TabsContent value="kunden" className="mt-4">
            <TicketTable items={tickets.filter(t => t.fromType === "Kunde")} />
          </TabsContent>
          <TabsContent value="mitarbeiter" className="mt-4">
            <TicketTable items={tickets.filter(t => t.fromType === "Mitarbeiter")} />
          </TabsContent>
        </Tabs>
      </Panel>
    </>
  );
}
