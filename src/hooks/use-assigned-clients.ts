import { useMemo } from "react";
import { ASSIGNED_CLIENT_IDS, MOCK_CLIENTS, type MockClient } from "@/lib/mitarbeiter-mock";

// Mockup-Hook. Später: Query gegen `assignments` Tabelle joined mit `clients`
// gefiltert auf `employees.user_id = auth.uid()`.
export function useAssignedClients(): {
  clients: MockClient[];
  ids: string[];
  isAssigned: (clientId: string) => boolean;
  byId: (id: string) => MockClient | undefined;
} {
  return useMemo(() => {
    const clients = MOCK_CLIENTS.filter((c) => ASSIGNED_CLIENT_IDS.includes(c.id));
    return {
      clients,
      ids: ASSIGNED_CLIENT_IDS,
      isAssigned: (id: string) => ASSIGNED_CLIENT_IDS.includes(id),
      byId: (id: string) => clients.find((c) => c.id === id),
    };
  }, []);
}
