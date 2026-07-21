import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveCall {
  id: string;
  sipgate_call_id: string;
  direction: "in" | "out";
  from_number: string | null;
  to_number: string | null;
  client_id: string | null;
  answered_by_employee_id: string | null;
  handled_by_employee_id: string | null;
  status: "ringing" | "answered" | "missed" | "ended";
  caller_name: string | null;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
}

/**
 * Live-Anrufe: klingelnde und angenommene Anrufe.
 * RLS filtert bereits auf zugewiesene Kunden.
 */
export function useLiveCalls() {
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initial() {
      const { data, error } = await supabase
        .from("sipgate_calls")
        .select("*")
        .in("status", ["ringing", "answered"])
        .order("started_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        console.error("[useLiveCalls] initial load failed:", error.message);
      }
      setCalls((data as LiveCall[]) ?? []);
      setLoading(false);
    }
    initial();

    const channel = supabase
      .channel("sipgate_calls_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sipgate_calls" },
        (payload) => {
          setCalls((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as LiveCall;
              if (row.status !== "ringing" && row.status !== "answered") return prev;
              if (prev.some((c) => c.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as LiveCall;
              const active = row.status === "ringing" || row.status === "answered";
              if (!active) return prev.filter((c) => c.id !== row.id);
              const idx = prev.findIndex((c) => c.id === row.id);
              if (idx === -1) return [row, ...prev];
              const next = prev.slice();
              next[idx] = row;
              return next;
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as LiveCall;
              return prev.filter((c) => c.id !== row.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { calls, loading };
}
