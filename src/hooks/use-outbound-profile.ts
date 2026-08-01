import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type OutboundProfile = {
  employeeId: string | null;
  outboundRecruitment: boolean;
  clientId: string | null;
};

/** Liefert, ob der angemeldete Mitarbeiter im Outbound-Recruitment-Modus arbeitet. */
export function useOutboundProfile() {
  const { user } = useAuth();

  return useQuery<OutboundProfile>({
    enabled: !!user,
    queryKey: ["outbound-profile", user?.id ?? "anon"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select("id, outbound_recruitment")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!emp) return { employeeId: null, outboundRecruitment: false, clientId: null };

      let clientId: string | null = null;
      if (emp.outbound_recruitment) {
        const { data: assignment } = await supabase
          .from("assignments")
          .select("client_id")
          .eq("employee_id", emp.id)
          .limit(1)
          .maybeSingle();
        clientId = assignment?.client_id ?? null;
      }

      return {
        employeeId: emp.id,
        outboundRecruitment: !!emp.outbound_recruitment,
        clientId,
      };
    },
  });
}
