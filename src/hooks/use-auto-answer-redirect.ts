import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const FRESH_MS = 60_000;

export interface SipgateHangupDetail {
  callId: string;
  sipgateCallId: string | null;
  from: string | null;
  to: string | null;
}

/**
 * Global hook: when a sipgate call is answered by the current employee,
 * navigate their browser to /mitarbeiter/erfassen?call=<id>&auto=1.
 * On hangup for the same employee, dispatch a window event so the
 * Erfassen page can stop its timer automatically.
 */
export function useAutoAnswerRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const seenAnswers = useRef<Set<string>>(new Set());
  const seenHangups = useRef<Set<string>>(new Set());
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let myEmpId: string | null = null;

    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      myEmpId = data?.id ?? null;
    })();

    const channel = supabase
      .channel("sipgate_auto_redirect")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sipgate_calls" },
        (payload) => {
          if (!myEmpId) return;
          const row = payload.new as {
            id: string;
            sipgate_call_id: string | null;
            status: string;
            answered_by_employee_id: string | null;
            handled_by_employee_id: string | null;
            answered_at: string | null;
            from_number: string | null;
            to_number: string | null;
          };
          const mine =
            row.answered_by_employee_id === myEmpId ||
            row.handled_by_employee_id === myEmpId;
          if (!mine) return;

          if (row.status === "answered") {
            if (seenAnswers.current.has(row.id)) return;
            const answeredAt = row.answered_at
              ? new Date(row.answered_at).getTime()
              : 0;
            if (!answeredAt || Date.now() - answeredAt > FRESH_MS) return;
            seenAnswers.current.add(row.id);

            const currentSearch = new URLSearchParams(
              locationRef.current.search,
            );
            const alreadyHere =
              locationRef.current.pathname === "/mitarbeiter/erfassen" &&
              currentSearch.get("call") === row.id;
            if (alreadyHere) return;

            toast.success("Anruf angenommen — wird geöffnet");
            navigate(`/mitarbeiter/erfassen?call=${row.id}&auto=1`);
            return;
          }

          if (row.status === "ended" || row.status === "missed") {
            if (seenHangups.current.has(row.id)) return;
            seenHangups.current.add(row.id);
            const detail: SipgateHangupDetail = {
              callId: row.id,
              sipgateCallId: row.sipgate_call_id,
              from: row.from_number,
              to: row.to_number,
            };
            window.dispatchEvent(
              new CustomEvent<SipgateHangupDetail>("sipgate:hangup", { detail }),
            );
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);
}
