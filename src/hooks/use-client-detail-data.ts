import { useEffect } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClientCall = {
  id: string;
  status: string;
  from_number: string | null;
  caller_name: string | null;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  dauerSek: number;
};

export type ClientNote = {
  id: string;
  anrufer_name: string | null;
  anrufer_nummer: string | null;
  anliegen: string;
  kategorie: string | null;
  prioritaet: string;
  dauer_sekunden: number;
  created_at: string;
};

function durationOf(answered: string | null, ended: string | null) {
  if (!answered || !ended) return 0;
  const sek = Math.round((new Date(ended).getTime() - new Date(answered).getTime()) / 1000);
  return sek > 0 ? sek : 0;
}

/** Lädt echte Anrufe (sipgate_calls) und Notizen (call_notes) zu einem Kunden. */
export function useClientDetailData(clientId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["client-detail-data", clientId];

  const { data } = useSuspenseQuery({
    queryKey,
    queryFn: async () => {
      const [callsRes, notesRes] = await Promise.all([
        supabase
          .from("sipgate_calls")
          .select("id, status, from_number, caller_name, started_at, answered_at, ended_at")
          .eq("client_id", clientId)
          .order("started_at", { ascending: false })
          .limit(20),
        supabase
          .from("call_notes")
          .select(
            "id, anrufer_name, anrufer_nummer, anliegen, kategorie, prioritaet, dauer_sekunden, created_at",
          )
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (callsRes.error) throw callsRes.error;
      if (notesRes.error) throw notesRes.error;

      const calls: ClientCall[] = (callsRes.data ?? []).map((c) => ({
        id: c.id,
        status: c.status,
        from_number: c.from_number,
        caller_name: c.caller_name,
        started_at: c.started_at,
        answered_at: c.answered_at,
        ended_at: c.ended_at,
        dauerSek: durationOf(c.answered_at, c.ended_at),
      }));

      return { calls, notes: (notesRes.data ?? []) as ClientNote[] };
    },
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["client-detail-data", clientId] });
    const channel = supabase
      .channel(`client-detail-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sipgate_calls", filter: `client_id=eq.${clientId}` },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_notes", filter: `client_id=eq.${clientId}` },
        invalidate,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clientId, queryClient]);

  return data;
}
