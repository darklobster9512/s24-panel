ALTER TABLE public.chat_agent_settings
  DROP COLUMN IF EXISTS status_text,
  ADD COLUMN IF NOT EXISTS online_from time NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS offline_after time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS auto_offline boolean NOT NULL DEFAULT true;

ALTER TABLE public.telegram_recipients
  ADD COLUMN IF NOT EXISTS notify_chat boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_onboarding boolean NOT NULL DEFAULT true;

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
  start_date date,
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

CREATE POLICY "Managers manage onboarding appointments"
ON public.onboarding_appointments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_onboarding_appointments_updated_at
BEFORE UPDATE ON public.onboarding_appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_onboarding_appointments_date ON public.onboarding_appointments (appointment_date);

CREATE POLICY "Managers can view employees"
ON public.employees FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can view employee contracts"
ON public.employee_contracts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS startklar_ab date;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS internal_interviews boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_interviews_since timestamptz;

CREATE OR REPLACE FUNCTION public.has_internal_interviews()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid() AND e.internal_interviews = true
  )
$$;

CREATE OR REPLACE FUNCTION public.employees_track_internal_interviews()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.internal_interviews THEN
      NEW.internal_interviews_since := now();
    ELSE
      NEW.internal_interviews_since := NULL;
    END IF;
  ELSE
    IF NEW.internal_interviews AND NOT COALESCE(OLD.internal_interviews, false) THEN
      NEW.internal_interviews_since := now();
    ELSIF NOT NEW.internal_interviews THEN
      NEW.internal_interviews_since := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS employees_track_internal_interviews ON public.employees;
CREATE TRIGGER employees_track_internal_interviews
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.employees_track_internal_interviews();

CREATE OR REPLACE FUNCTION public.internal_interviews_since()
RETURNS timestamptz
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.internal_interviews_since
  FROM public.employees e
  WHERE e.user_id = auth.uid() AND e.internal_interviews = true
  ORDER BY e.internal_interviews_since NULLS LAST
  LIMIT 1
$$;

CREATE POLICY "Internal interviewers can view interview appointments"
ON public.interview_appointments FOR SELECT
USING (
  public.has_internal_interviews()
  AND ((appointment_date + appointment_time) AT TIME ZONE 'Europe/Berlin') >= public.internal_interviews_since()
);

CREATE POLICY "Internal interviewers can update interview appointments"
ON public.interview_appointments FOR UPDATE
USING (
  public.has_internal_interviews()
  AND ((appointment_date + appointment_time) AT TIME ZONE 'Europe/Berlin') >= public.internal_interviews_since()
);

CREATE POLICY "Internal interviewers can view applications"
ON public.applications FOR SELECT
USING (
  public.has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ((ia.appointment_date + ia.appointment_time) AT TIME ZONE 'Europe/Berlin') >= public.internal_interviews_since()
  )
);

CREATE POLICY "Internal interviewers can update applications"
ON public.applications FOR UPDATE
USING (
  public.has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ((ia.appointment_date + ia.appointment_time) AT TIME ZONE 'Europe/Berlin') >= public.internal_interviews_since()
  )
);

CREATE POLICY "Internal interviewers can read application files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'applications' AND public.has_internal_interviews());

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
  ADD COLUMN IF NOT EXISTS sms_interview_text text DEFAULT 'Hallo {vorname}, danke fuer deine Bewerbung bei {unternehmen}. Buche dein Bewerbungsgespraech hier: {link}',
  ADD COLUMN IF NOT EXISTS sms_confirmation_text text DEFAULT 'Hallo {vorname}, dein Bewerbungsgespräch bei {unternehmen} ist bestätigt: {datum} um {uhrzeit} Uhr. Bis dann!',
  ADD COLUMN IF NOT EXISTS sms_reminder_text text DEFAULT 'Hallo {vorname}, Erinnerung: dein Bewerbungsgespräch bei {unternehmen} startet um {uhrzeit} Uhr.';

UPDATE public.app_settings
  SET sms_confirmation_text = COALESCE(sms_confirmation_text, 'Hallo {vorname}, dein Bewerbungsgespräch bei {unternehmen} ist bestätigt: {datum} um {uhrzeit} Uhr. Bis dann!'),
      sms_reminder_text = COALESCE(sms_reminder_text, 'Hallo {vorname}, Erinnerung: dein Bewerbungsgespräch bei {unternehmen} startet um {uhrzeit} Uhr.');

ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS sms_reminder_sent_at timestamp with time zone;