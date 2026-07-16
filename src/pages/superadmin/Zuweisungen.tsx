import { useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const agents = ["Sofia W.", "Jan H.", "Lea M.", "Ömer K.", "Nina B."];
const clients = [
  "Meier & Partner GmbH",
  "Zahnpraxis Nord",
  "Beckmann Immobilien",
  "Café Sonne",
  "Kanzlei Brandt & Söhne",
  "Fitness Studio Kraftwerk",
];

const initial: Record<string, Set<string>> = {
  "Sofia W.": new Set(["Meier & Partner GmbH", "Beckmann Immobilien"]),
  "Jan H.": new Set(["Zahnpraxis Nord", "Kanzlei Brandt & Söhne"]),
  "Lea M.": new Set(["Café Sonne"]),
  "Ömer K.": new Set(["Meier & Partner GmbH", "Beckmann Immobilien", "Fitness Studio Kraftwerk"]),
  "Nina B.": new Set([]),
};

export default function Zuweisungen() {
  const [matrix, setMatrix] = useState(initial);

  const toggle = (agent: string, client: string) => {
    setMatrix((prev) => {
      const next = { ...prev, [agent]: new Set(prev[agent]) };
      if (next[agent].has(client)) next[agent].delete(client);
      else next[agent].add(client);
      return next;
    });
  };

  return (
    <>
      <PageHeader
        title="Zuweisungen"
        subtitle="Ordne Mitarbeitern die Kunden zu, für die sie Calls und Notizen anlegen dürfen."
        actions={<Button size="sm" variant="outline">Änderungen speichern</Button>}
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 bg-card py-3 pr-4">Mitarbeiter</th>
                {clients.map((c) => (
                  <th key={c} className="min-w-[140px] px-2 py-3 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {agents.map((a) => (
                <tr key={a}>
                  <td className="sticky left-0 bg-card py-3 pr-4 font-medium">{a}</td>
                  {clients.map((c) => (
                    <td key={c} className="px-2 py-3">
                      <Checkbox
                        checked={matrix[a]?.has(c)}
                        onCheckedChange={() => toggle(a, c)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
