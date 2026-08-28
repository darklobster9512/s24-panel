import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type OutboundProfile = {
  employeeId: string | null;
  outboundRecruitment: boolean;
  clientId: string | null;
  onboardingEnabled: boolean;
  internalInterviews: boolean;
  internalInterviewsSince: string | null;
};

const cacheKey = (userId: string) => `outbound-profile:${userId}`;

function readCache(userId: string | undefined): OutboundProfile | undefined {
  if (!userId) return undefined;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.outboundRecruitment !== "boolean") return undefined;
    return {
      employeeId: parsed.employeeId ?? null,
      outboundRecruitment: parsed.outboundRecruitment,
      clientId: parsed.clientId ?? null,
      onboardingEnabled: !!parsed.onboardingEnabled,
      internalInterviews: !!parsed.internalInterviews,
      internalInterviewsSince: parsed.internalInterviewsSince ?? null,
    };
  } catch {
    return undefined;
  }
}

function writeCache(userId: string, value: OutboundProfile) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Liefert, ob der angemeldete Mitarbeiter im Outbound-Recruitment-Modus arbeitet. */
export function useOutboundProfile() {
  const { user } = useAuth();
  const cached = readCache(user?.id);

  return useQuery<OutboundProfile>({
    enabled: !!user,
    queryKey: ["outbound-profile", user?.id ?? "anon"],
    staleTime: 5 * 60_000,
    // Sofort den zuletzt bekannten Modus rendern -> kein Umspringen der Sidebar
    initialData: cached,
    initialDataUpdatedAt: cached ? 0 : undefined,
    queryFn: async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select(
          "id, outbound_recruitment, onboarding_enabled, internal_interviews, internal_interviews_since",
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      let result: OutboundProfile;

      if (!emp) {
        result = {
          employeeId: null,
          outboundRecruitment: false,
          clientId: null,
          onboardingEnabled: false,
          internalInterviews: false,
          internalInterviewsSince: null,
        };
      } else {
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
        result = {
          employeeId: emp.id,
          outboundRecruitment: !!emp.outbound_recruitment,
          clientId,
          onboardingEnabled: !!(emp as { onboarding_enabled?: boolean | null }).onboarding_enabled,
          internalInterviews: !!(emp as { internal_interviews?: boolean | null })
            .internal_interviews,
          internalInterviewsSince:
            (emp as { internal_interviews_since?: string | null }).internal_interviews_since ??
            null,
        };
      }

      writeCache(user!.id, result);
      return result;
    },
  });
}
