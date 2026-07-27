import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatActivityTimestamp, type ActivityEntry } from "@/lib/activityLog";

type Props = {
  /** Optionaler Filter, z. B. "interview_appointment" */
  entityType?: string;
  title?: string;
  initialLimit?: number;
};

export default function ActivityLogCard({
  entityType,
  title = "Aktivitätsprotokoll",
  initialLimit = 5,
}: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let query = (supabase as any)
        .from("activity_log")
        .select("id, actor_email, action, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (entityType) query = query.eq("entity_type", entityType);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) console.error("[ActivityLogCard] load failed:", error.message);
      setEntries((data as ActivityEntry[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("superadmin_activity_log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () =>
        load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [entityType]);

  const visible = expanded ? entries : entries.slice(0, initialLimit);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        {entries.length > initialLimit && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? (
              <>
                Weniger <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Mehr anzeigen <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="py-2 text-sm text-muted-foreground">Lade Aktivitäten…</p>
        ) : entries.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Noch keine Aktivitäten erfasst.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {visible.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
              >
                <Badge variant="outline" className="font-normal">
                  {formatActivityTimestamp(e.created_at)}
                </Badge>
                <span className="font-medium">{e.action}</span>
                {e.details?.subject && (
                  <span className="text-muted-foreground">— {e.details.subject}</span>
                )}
                {e.details?.from && e.details?.to && (
                  <span className="text-xs text-muted-foreground">
                    ({e.details.from} → {e.details.to})
                  </span>
                )}
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {e.actor_email ?? "Unbekannt"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
