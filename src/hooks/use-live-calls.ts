import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
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

const STALE_MS = 15 * 60 * 1000;

function isFresh(startedAt: string) {
  return Date.now() - new Date(startedAt).getTime() < STALE_MS;
}

export function useLiveCalls() {
  const { data: initial } = useSuspenseQuery<LiveCall[]>({
    queryKey: ["live-calls-initial"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - STALE_MS).toISOString();
      const { data, error } = await supabase
        .from("sipgate_calls")
        .select("*")
        .eq("status", "ringing")
        .gte("started_at", cutoff)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as LiveCall[]) ?? [];
    },
    staleTime: 0,
  });

  const [calls, setCalls] = useState<LiveCall[]>(initial);

  useEffect(() => {
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
              if (!isFresh(row.started_at)) return prev;
              if (prev.some((c) => c.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as LiveCall;
              const active =
                (row.status === "ringing" || row.status === "answered") &&
                isFresh(row.started_at);
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

    const interval = setInterval(() => {
      setCalls((prev) => {
        const filtered = prev.filter((c) => isFresh(c.started_at));
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { calls, loading: false as const };
}
