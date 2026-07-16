import { PageHeader, Panel, StatCard } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Clock, CheckCircle2 } from "lucide-react";

const payouts = [
  { name: "Sofia Weber", period: "Juli 2026", hours: 152, calls: 128, amount: "€ 3.200", status: "Freigegeben" },
  { name: "Jan Hoffmann", period: "Juli 2026", hours: 88, calls: 96, amount: "€ 1.800", status: "Offen" },
  { name: "Lea Müller", period: "Juli 2026", hours: 156, calls: 142, amount: "€ 3.100", status: "Ausgezahlt" },
  { name: "Ömer Kaya", period: "Juli 2026", hours: 160, calls: 168, amount: "€ 3.400", status: "Freigegeben" },
  { name: "Nina Berger", period: "Juli 2026", hours: 42, calls: 54, amount: "€ 1.344", status: "Offen" },
];

const variant: Record<string, "default" | "secondary" | "outline"> = {
  "Offen": "secondary",
  "Freigegeben": "default",
  "Ausgezahlt": "outline",
};

export default function Auszahlungen() {
  return (
    <>
      <PageHeader
        title="Auszahlungen"
        subtitle="Monatliche Auszahlungen an Mitarbeiter freigeben und tracken."
        actions={
          <>
            <Button size="sm" variant="outline">Export CSV</Button>
            <Button size="sm">Alle offenen freigeben</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Offen" value="€ 3.144" delta="2 Mitarbeiter" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Freigegeben" value="€ 6.600" delta="2 Mitarbeiter" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Ausgezahlt (Monat)" value="€ 3.100" delta="1 Mitarbeiter" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Panel>
        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[1.4fr_120px_100px_100px_120px_140px_120px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Mitarbeiter</span>
            <span>Zeitraum</span>
            <span>Stunden</span>
            <span>Anrufe</span>
            <span>Betrag</span>
            <span>Status</span>
            <span></span>
          </div>
          {payouts.map((p) => (
            <div key={p.name} className="grid grid-cols-[1.4fr_120px_100px_100px_120px_140px_120px] gap-4 py-3 text-sm items-center">
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">{p.period}</span>
              <span className="font-mono">{p.hours}</span>
              <span className="font-mono">{p.calls}</span>
              <span className="font-mono font-medium">{p.amount}</span>
              <Badge variant={variant[p.status]} className="w-fit">{p.status}</Badge>
              {p.status === "Offen" ? (
                <Button size="sm" variant="outline">Freigeben</Button>
              ) : p.status === "Freigegeben" ? (
                <Button size="sm" variant="outline">Als bezahlt</Button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
