
-- 1. applications: booking_token
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS booking_token uuid UNIQUE;

-- 2. app_settings: interview email + slot config
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS interview_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS interview_email_subject text DEFAULT 'Buche dein Bewerbungsgespräch bei Sekretariat24',
  ADD COLUMN IF NOT EXISTS interview_email_body text DEFAULT E'Hallo {{vorname}},\n\nwir freuen uns über deine Bewerbung und würden dich gerne persönlich kennenlernen.\n\nBitte wähle über den folgenden Link einen für dich passenden Termin für dein Bewerbungsgespräch:\n\n{{booking_url}}\n\nWir freuen uns auf das Gespräch!\n\nViele Grüße\nDein Sekretariat24-Team',
  ADD COLUMN IF NOT EXISTS interview_slot_start time NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS interview_slot_end time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS interview_slot_interval_minutes int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS interview_available_weekdays int[] NOT NULL DEFAULT ARRAY[1,2,3,4,5];

-- 3. interview_appointments table
CREATE TABLE IF NOT EXISTS public.interview_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  notes text,
  booked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_appointments_date
  ON public.interview_appointments (appointment_date, appointment_time);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_appointments TO authenticated;
GRANT ALL ON public.interview_appointments TO service_role;

ALTER TABLE public.interview_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins manage interview appointments" ON public.interview_appointments;
CREATE POLICY "Superadmins manage interview appointments"
  ON public.interview_appointments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP TRIGGER IF EXISTS interview_appointments_updated_at ON public.interview_appointments;
CREATE TRIGGER interview_appointments_updated_at
  BEFORE UPDATE ON public.interview_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPCs for public booking (SECURITY DEFINER, token-based)

-- Get applicant info by booking token (no PII leak: only first/last name + existing appointment)
CREATE OR REPLACE FUNCTION public.get_interview_by_token(_token uuid)
RETURNS TABLE (
  application_id uuid,
  vorname text,
  nachname text,
  appointment_date date,
  appointment_time time,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.vorname, a.nachname,
         ia.appointment_date, ia.appointment_time, ia.status
  FROM public.applications a
  LEFT JOIN public.interview_appointments ia ON ia.application_id = a.id
  WHERE a.booking_token = _token
  LIMIT 1;
$$;

-- Public list of booked date/time slots (no PII)
CREATE OR REPLACE FUNCTION public.list_booked_interview_slots()
RETURNS TABLE (appointment_date date, appointment_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT appointment_date, appointment_time
  FROM public.interview_appointments
  WHERE appointment_date >= CURRENT_DATE;
$$;

-- Book/rebook slot via token
CREATE OR REPLACE FUNCTION public.book_interview_slot(
  _token uuid,
  _date date,
  _time time
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app_id uuid;
  _appt_id uuid;
BEGIN
  SELECT id INTO _app_id FROM public.applications WHERE booking_token = _token;
  IF _app_id IS NULL THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  IF _date < CURRENT_DATE THEN
    RAISE EXCEPTION 'past_date';
  END IF;

  -- Slot already taken by another application?
  IF EXISTS (
    SELECT 1 FROM public.interview_appointments
    WHERE appointment_date = _date
      AND appointment_time = _time
      AND application_id <> _app_id
  ) THEN
    RAISE EXCEPTION 'slot_taken';
  END IF;

  INSERT INTO public.interview_appointments (application_id, appointment_date, appointment_time, status, booked_at)
  VALUES (_app_id, _date, _time, 'neu', now())
  ON CONFLICT (application_id) DO UPDATE
    SET appointment_date = EXCLUDED.appointment_date,
        appointment_time = EXCLUDED.appointment_time,
        status = 'neu',
        booked_at = now(),
        updated_at = now()
  RETURNING id INTO _appt_id;

  UPDATE public.applications
    SET status = 'termin_gebucht', updated_at = now()
    WHERE id = _app_id;

  RETURN _appt_id;
END;
$$;

-- Slot config for public page
CREATE OR REPLACE FUNCTION public.get_interview_slot_config()
RETURNS TABLE (
  slot_start time,
  slot_end time,
  interval_minutes int,
  weekdays int[],
  company_name text,
  accent_color text,
  logo_text text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT interview_slot_start, interview_slot_end, interview_slot_interval_minutes,
         interview_available_weekdays, company_name, accent_color, logo_text
  FROM public.app_settings
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_interview_by_token(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_booked_interview_slots() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_interview_slot(uuid, date, time) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_interview_slot_config() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_interview_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_booked_interview_slots() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_interview_slot(uuid, date, time) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_interview_slot_config() TO anon, authenticated;
