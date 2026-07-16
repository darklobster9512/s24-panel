CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  website text NOT NULL,
  company_description text NOT NULL,
  industry text NOT NULL,
  contact_person text NOT NULL,
  street text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  vat_id text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  contact_phone text,
  contact_email text,
  logo_url text,
  greeting_text text NOT NULL,
  forwarding_enabled boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all clients"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for client-logos bucket (bucket created separately)
CREATE POLICY "Public read for client-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-logos');

CREATE POLICY "Superadmins can upload client-logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-logos' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update client-logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client-logos' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete client-logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-logos' AND public.has_role(auth.uid(), 'superadmin'));