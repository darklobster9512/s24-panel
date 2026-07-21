import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type MyContract = {
  id: string;
  employee_id: string;
  template_id: string;
  status: "pending_employee" | "pending_admin" | "completed";
  pdf_path: string | null;
};

/** Loads the active arbeitsvertrag for the currently signed-in employee (if any). */
export function useMyContract() {
  const { user, role } = useAuth();
  return useSuspenseQuery<MyContract | null>({
    queryKey: ["my-contract", user?.id ?? "anon", role],
    queryFn: async () => {
      if (!user || role !== "mitarbeiter") return null;
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!emp) return null;
      const { data: ec } = await (supabase as any)
        .from("employee_contracts")
        .select("id, employee_id, template_id, status, pdf_path")
        .eq("employee_id", (emp as { id: string }).id)
        .maybeSingle();
      return (ec as MyContract | null) ?? null;
    },
  });
}
