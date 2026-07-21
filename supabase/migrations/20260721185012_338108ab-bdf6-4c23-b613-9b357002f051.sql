CREATE TABLE public.caller_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  caller_name text,
  caller_email text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, phone_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.caller_contacts TO authenticated;
GRANT ALL ON public.caller_contacts TO service_role;

ALTER TABLE public.caller_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins full access to caller_contacts"
ON public.caller_contacts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Mitarbeiter can view assigned caller_contacts"
ON public.caller_contacts FOR SELECT
TO authenticated
USING (public.is_client_assigned_to_me(client_id));

CREATE POLICY "Mitarbeiter can insert assigned caller_contacts"
ON public.caller_contacts FOR INSERT
TO authenticated
WITH CHECK (public.is_client_assigned_to_me(client_id));

CREATE POLICY "Mitarbeiter can update assigned caller_contacts"
ON public.caller_contacts FOR UPDATE
TO authenticated
USING (public.is_client_assigned_to_me(client_id))
WITH CHECK (public.is_client_assigned_to_me(client_id));

CREATE INDEX idx_caller_contacts_lookup ON public.caller_contacts(client_id, phone_number);

CREATE TRIGGER update_caller_contacts_updated_at
BEFORE UPDATE ON public.caller_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();