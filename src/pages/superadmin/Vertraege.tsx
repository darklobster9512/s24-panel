import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Download, Plus } from "lucide-react";

const employeeContracts = [
  { name: "Sofia Weber", type: "Vollzeit", rate: "€ 3.200 / Monat", start: "01.02.2024", status: "aktiv" },
  { name: "Jan Hoffmann", type: "Teilzeit", rate: "€ 1.800 / Monat", start: "15.05.2024", status: "aktiv" },
  { name: "Lea Müller", type: "Vollzeit", rate: "€ 3.100 / Monat", start: "01.09.2023", status: "aktiv" },
  { name: "Ömer Kaya", type: "Vollzeit", rate: "€ 3.400 / Monat", start: "01.11.2023", status: "aktiv" },
  { name: "Nina Berger", type: "Freelance", rate: "€ 32 / Stunde", start: "10.03.2025", status: "aktiv" },
];

const clientContracts = [
  { name: "Meier & Partner GmbH", plan: "Business", term: "12 Monate", notice: "3 Monate", ends: "31.12.2026", status: "aktiv" },
  { name: "Zahnpraxis Nord", plan: "Starter", term: "monatlich", notice: "1 Monat", ends: "—", status: "aktiv" },
  { name: "Beckmann Immobilien", plan: "Enterprise", term: "24 Monate", notice: "6 Monate", ends: "31.05.2027", status: "aktiv" },
  { name: "Café Sonne", plan: "Starter", term: "monatlich", notice: "1 Monat", ends: "—", status: "gekündigt" },
];

export default function Vertraege() {
  return (
    <>
      <PageHeader
        title="Verträge"
        subtitle="Arbeitsverträge und Kundenverträge zentral verwalten."
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Vertrag anlegen
          </Button>
        }
      />

      <Panel>
        <Tabs defaultValue="mitarbeiter">
          <TabsList>
            <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
            <TabsTrigger value="kunden">Kunden</TabsTrigger>
          </TabsList>

          <TabsContent value="mitarbeiter" className="mt-4">
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-[1.4fr_120px_180px_120px_100px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Mitarbeiter</span>
                <span>Typ</span>
                <span>Vergütung</span>
                <span>Start</span>
                <span>Status</span>
                <span></span>
              </div>
              {employeeContracts.map((c) => (
                <div key={c.name} className="grid grid-cols-[1.4fr_120px_180px_120px_100px_100px] gap-4 py-3 text-sm items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <span className="text-muted-foreground">{c.type}</span>
                  <span className="font-mono text-xs">{c.rate}</span>
                  <span className="text-muted-foreground">{c.start}</span>
                  <Badge variant="default" className="w-fit capitalize">{c.status}</Badge>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="kunden" className="mt-4">
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-[1.4fr_120px_120px_120px_120px_100px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Kunde</span>
                <span>Plan</span>
                <span>Laufzeit</span>
                <span>Kündigung</span>
                <span>Ende</span>
                <span>Status</span>
                <span></span>
              </div>
              {clientContracts.map((c) => (
                <div key={c.name} className="grid grid-cols-[1.4fr_120px_120px_120px_120px_100px_100px] gap-4 py-3 text-sm items-center">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.plan}</span>
                  <span className="text-muted-foreground">{c.term}</span>
                  <span className="text-muted-foreground">{c.notice}</span>
                  <span className="font-mono text-xs">{c.ends}</span>
                  <Badge variant={c.status === "aktiv" ? "default" : "secondary"} className="w-fit capitalize">
                    {c.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Panel>
    </>
  );
}
