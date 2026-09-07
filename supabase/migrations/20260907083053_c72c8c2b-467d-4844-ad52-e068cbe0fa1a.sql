CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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

CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT NOT NULL,
  handynummer TEXT NOT NULL,
  geburtsdatum DATE NOT NULL,
  staatsangehoerigkeit TEXT NOT NULL,
  anstellung TEXT NOT NULL,
  lebenslauf_path TEXT,
  lebenslauf_filename TEXT,
  lebenslauf_mime TEXT,
  status TEXT NOT NULL DEFAULT 'neu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view applications"
  ON public.applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete applications"
  ON public.applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

CREATE POLICY "Superadmin can read application files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete application files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'superadmin'));

CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  company_name text,
  company_address text,
  vat_id text,
  accent_color text DEFAULT '#7bed9f',
  logo_text text DEFAULT 'Sekreteriat24',
  resend_api_key text,
  resend_from_name text,
  resend_from_email text,
  application_email_enabled boolean NOT NULL DEFAULT false,
  application_email_subject text DEFAULT 'Deine Bewerbung bei Sekreteriat24',
  application_email_body text DEFAULT 'Hallo {{vorname}},

vielen Dank für deine Bewerbung. Wir haben deine Unterlagen erhalten und melden uns in Kürze.

Viele Grüße
Sekreteriat24',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can read settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can insert settings" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (singleton, company_name, company_address, vat_id)
VALUES (true, 'Sekreteriat24 GmbH', 'Musterstraße 12, 10115 Berlin', 'DE123456789')
ON CONFLICT (singleton) DO NOTHING;