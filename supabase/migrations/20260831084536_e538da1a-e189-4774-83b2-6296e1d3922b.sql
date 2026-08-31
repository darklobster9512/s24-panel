CREATE TABLE public.short_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  target_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.short_links TO anon;
GRANT SELECT ON public.short_links TO authenticated;
GRANT ALL ON public.short_links TO service_role;

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "short_links_public_select"
ON public.short_links FOR SELECT
USING (true);

CREATE POLICY "short_links_superadmin_insert"
ON public.short_links FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TABLE public.sms_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  normalized_recipient text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_logs_superadmin_select"
ON public.sms_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS sms_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seven_api_key text,
  ADD COLUMN IF NOT EXISTS sms_sender_name text,
  ADD COLUMN IF NOT EXISTS sms_interview_text text DEFAULT 'Hallo {vorname}, danke fuer deine Bewerbung bei {unternehmen}. Buche dein Bewerbungsgespraech hier: {link}';