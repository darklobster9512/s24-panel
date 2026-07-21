import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    enabled: !!user && role === "mitarbeiter",
    queryKey: ["my-contract", user?.id],
    queryFn: async () => {
      // Employees table row for me
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user!.id)
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
