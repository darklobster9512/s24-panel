import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface AssignedClient {
  id: string;
  name: string;
  branche: string | null;
  telefon: string | null;
  logoPath: string | null;
  firmeninhalt: string | null;
  begruessung: string | null;
  weiterleitung: boolean;
  ansprechpartner: string | null;
  ansprechpartnerTel: string | null;
  ansprechpartnerEmail: string | null;
  email: string | null;
  website: string | null;
  adresse: string;
  strasse: string | null;
  plz: string | null;
  stadt: string | null;
  vatId: string | null;
}

function buildAdresse(street: string | null, plz: string | null, city: string | null) {
  const line2 = [plz, city].filter(Boolean).join(" ");
  return [street, line2].filter(Boolean).join(", ");
}

type Result = {
  clients: AssignedClient[];
  logoUrls: Record<string, string>;
};

export function useAssignedClients() {
  const { user } = useAuth();

  const { data } = useSuspenseQuery<Result>({
    queryKey: ["assigned-clients", user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignments").select(
        `client:clients (
          id, company_name, industry, phone, logo_url,
          company_description, greeting_text, forwarding_enabled,
          contact_person, contact_phone, contact_email,
          email, website, street, postal_code, city, vat_id, is_draft
        )`,
      );
      if (error) throw error;

      const rows = (data ?? [])
        .map((r: any) => r.client)
        .filter((c: any) => c && !c.is_draft);

      const seen = new Set<string>();
      const clients: AssignedClient[] = [];
      for (const c of rows) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        clients.push({
          id: c.id,
          name: c.company_name ?? "Unbenannter Kunde",
          branche: c.industry,
          telefon: c.phone,
          logoPath: c.logo_url,
          firmeninhalt: c.company_description,
          begruessung: c.greeting_text,
          weiterleitung: !!c.forwarding_enabled,
          ansprechpartner: c.contact_person,
          ansprechpartnerTel: c.contact_phone,
          ansprechpartnerEmail: c.contact_email,
          email: c.email,
          website: c.website,
          strasse: c.street,
          plz: c.postal_code,
          stadt: c.city,
          adresse: buildAdresse(c.street, c.postal_code, c.city),
          vatId: c.vat_id,
        });
      }

      const urlEntries = await Promise.all(
        clients
          .filter((c) => c.logoPath)
          .map(async (c) => {
            const { data: signed } = await supabase.storage
              .from("client-logos")
              .createSignedUrl(c.logoPath as string, 3600);
            return [c.id, signed?.signedUrl ?? ""] as const;
          }),
      );
      const logoUrls = Object.fromEntries(urlEntries.filter(([, u]) => u));

      return { clients, logoUrls };
    },
  });

  const { clients, logoUrls } = data;
  return {
    clients,
    logoUrls,
    loading: false as const,
    error: null as null,
    byId: (id: string) => clients.find((c) => c.id === id),
    isAssigned: (id: string) => clients.some((c) => c.id === id),
    ids: clients.map((c) => c.id),
  };
}
