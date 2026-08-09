CREATE TABLE public.onboarding_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  vorname text,
  nachname text,
  email text,
  telefon text,
  stelle text,
  appointment_date date NOT NULL,
  appointment_time time without time zone NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'offen',
  reminder_sent_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_appointments TO authenticated;
GRANT ALL ON public.onboarding_appointments TO service_role;

ALTER TABLE public.onboarding_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage onboarding appointments"
ON public.onboarding_appointments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_onboarding_appointments_updated_at
BEFORE UPDATE ON public.onboarding_appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_onboarding_appointments_date ON public.onboarding_appointments (appointment_date);

ALTER TABLE public.telegram_recipients
  ADD COLUMN IF NOT EXISTS notify_onboarding boolean NOT NULL DEFAULT true;