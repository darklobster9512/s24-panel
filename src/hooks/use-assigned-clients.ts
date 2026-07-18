import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useAssignedClients() {
  const [clients, setClients] = useState<AssignedClient[]>([]);
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // Assignments → clients (nested). RLS filtert automatisch auf auth.uid().
      const { data, error: qErr } = await supabase
        .from("assignments")
        .select(
          `client:clients (
            id, company_name, industry, phone, logo_url,
            company_description, greeting_text, forwarding_enabled,
            contact_person, contact_phone, contact_email,
            email, website, street, postal_code, city, vat_id, is_draft
          )`,
        );

      if (cancelled) return;

      if (qErr) {
        setError(qErr.message);
        setClients([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? [])
        .map((r: any) => r.client)
        .filter((c: any) => c && !c.is_draft);

      // Dedupe (falls mehrere assignment-Zeilen für gleichen Kunden existieren)
      const seen = new Set<string>();
      const mapped: AssignedClient[] = [];
      for (const c of rows) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        mapped.push({
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

      setClients(mapped);
      setLoading(false);

      // Signed URLs für Logos (privater Bucket)
      const urlEntries = await Promise.all(
        mapped
          .filter((c) => c.logoPath)
          .map(async (c) => {
            const { data: signed } = await supabase.storage
              .from("client-logos")
              .createSignedUrl(c.logoPath as string, 3600);
            return [c.id, signed?.signedUrl ?? ""] as const;
          }),
      );
      if (!cancelled) {
        setLogoUrls(Object.fromEntries(urlEntries.filter(([, u]) => u)));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      clients,
      logoUrls,
      loading,
      error,
      byId: (id: string) => clients.find((c) => c.id === id),
      isAssigned: (id: string) => clients.some((c) => c.id === id),
      ids: clients.map((c) => c.id),
    }),
    [clients, logoUrls, loading, error],
  );
}
