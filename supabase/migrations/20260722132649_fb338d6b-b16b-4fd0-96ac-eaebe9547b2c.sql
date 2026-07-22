
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
