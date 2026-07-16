import { PageHeader, Panel, StatCard } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, TrendingUp, AlertCircle } from "lucide-react";

const invoices = [
  { nr: "2026-0142", kunde: "Meier & Partner GmbH", amount: "€ 890", due: "31.07.2026", status: "Bezahlt" },
  { nr: "2026-0143", kunde: "Zahnpraxis Nord", amount: "€ 149", due: "31.07.2026", status: "Offen" },
  { nr: "2026-0144", kunde: "Beckmann Immobilien", amount: "€ 2.490", due: "31.07.2026", status: "Offen" },
  { nr: "2026-0145", kunde: "Café Sonne", amount: "€ 149", due: "15.07.2026", status: "Überfällig" },
  { nr: "2026-0146", kunde: "Kanzlei Brandt", amount: "€ 690", due: "31.07.2026", status: "Bezahlt" },
];

const variant: Record<string, "default" | "secondary" | "destructive"> = {
  "Bezahlt": "default",
  "Offen": "secondary",
  "Überfällig": "destructive",
};

export default function Abrechnung() {
  return (
    <>
      <PageHeader
        title="Abrechnung"
        subtitle="Rechnungen an Kunden und offene Posten."
        actions={<Button size="sm">Rechnung erstellen</Button>}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Umsatz Monat" value="€ 24.680" delta="+8%" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Offene Posten" value="€ 2.788" delta="2 Rechnungen" icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Überfällig" value="€ 149" delta="1 Kunde" icon={<AlertCircle className="h-4 w-4" />} />
      </div>

      <Panel>
        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[120px_1fr_120px_120px_120px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Nr.</span>
            <span>Kunde</span>
            <span>Betrag</span>
            <span>Fällig</span>
            <span>Status</span>
            <span></span>
          </div>
          {invoices.map((i) => (
            <div key={i.nr} className="grid grid-cols-[120px_1fr_120px_120px_120px_100px] gap-4 py-3 text-sm items-center">
              <span className="font-mono text-xs">{i.nr}</span>
              <span className="font-medium">{i.kunde}</span>
              <span className="font-mono font-medium">{i.amount}</span>
              <span className="text-muted-foreground">{i.due}</span>
              <Badge variant={variant[i.status]} className="w-fit">{i.status}</Badge>
              <Button size="sm" variant="ghost">PDF</Button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
