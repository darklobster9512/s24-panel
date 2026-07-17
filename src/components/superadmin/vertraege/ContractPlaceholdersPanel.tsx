import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { CONTRACT_PLACEHOLDER_GROUPS } from "@/lib/contract-placeholders";

export function ContractPlaceholdersPanel({ onInsert }: { onInsert?: (token: string) => void }) {
  async function handleClick(token: string) {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* ignore */
    }
    if (onInsert) {
      onInsert(token);
      toast.success("Platzhalter eingefügt");
    } else {
      toast.success("Platzhalter kopiert");
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold">Verfügbare Platzhalter</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Klicke auf eine Variable, um sie an der Cursor-Position einzufügen. Beim Versand werden
          sie automatisch durch die Mitarbeiterdaten ersetzt.
        </p>
      </div>
      <div className="space-y-4">
        {CONTRACT_PLACEHOLDER_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => handleClick(item.token)}
                  title={item.label}
                  className="inline-flex items-center rounded border border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  {item.token}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
