import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { PhoneCall, Clock, StickyNote } from "lucide-react";

const DAILY = [
  { d: "Mo", calls: 22, avg: 168 },
  { d: "Di", calls: 28, avg: 152 },
  { d: "Mi", calls: 19, avg: 189 },
  { d: "Do", calls: 31, avg: 172 },
  { d: "Fr", calls: 24, avg: 145 },
  { d: "Sa", calls: 8, avg: 210 },
  { d: "So", calls: 3, avg: 240 },
];

const KATEGORIE = [
  { name: "Rückruf", value: 42, color: "hsl(var(--primary))" },
  { name: "Termin", value: 28, color: "#60a5fa" },
  { name: "Info", value: 18, color: "#fbbf24" },
  { name: "Weiterleitung", value: 8, color: "#a78bfa" },
  { name: "Beschwerde", value: 4, color: "#f87171" },
];

const PRO_KUNDE = [
  { name: "Meier & Partner", calls: 38 },
  { name: "Zahnpraxis Nord", calls: 27 },
  { name: "Beckmann Immo", calls: 22 },
  { name: "Café Sonne", calls: 13 },
];

const TIMEFRAMES = ["Woche", "Monat", "Quartal"] as const;

export default function Statistik() {
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("Woche");

  return (
    <>
      <PageHeader
        title="Meine Statistik"
        subtitle="Deine Performance-Kennzahlen."
        actions={
          <div className="inline-flex rounded-full border border-border/60 bg-card p-1">
            {TIMEFRAMES.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={t === tf ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setTf(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Anrufe" value="135" delta="+12%" icon={<PhoneCall className="h-4 w-4" />} />
        <StatCard label="Ø Dauer" value="2:58" delta="-8s" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Notizen" value="98" icon={<StickyNote className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Anrufe pro Tag">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Ø Gesprächsdauer (Sek)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DAILY}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Verteilung nach Kategorie">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={KATEGORIE} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {KATEGORIE.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Anrufe pro Kunde">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRO_KUNDE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
