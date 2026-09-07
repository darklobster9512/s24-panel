ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS outbound_recruitment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS caller_api_key text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS onboarding_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_system text,
  ADD COLUMN IF NOT EXISTS softphone_email text,
  ADD COLUMN IF NOT EXISTS softphone_password text;

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_phone_system_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_phone_system_check
  CHECK (phone_system IS NULL OR phone_system IN ('sipgate','placetel'));

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_recruitment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS call_script_path text,
  ADD COLUMN IF NOT EXISTS call_script_content text,
  ADD COLUMN IF NOT EXISTS call_script_my_name text,
  ADD COLUMN IF NOT EXISTS call_script_company_name text;

CREATE POLICY "Superadmin manages call scripts"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'call-scripts' AND public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (bucket_id = 'call-scripts' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employees read assigned call scripts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'call-scripts'
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.call_script_path = storage.objects.name
      AND public.is_client_assigned_to_me(c.id)
  )
);

ALTER TABLE public.call_notes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notes;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS welcome_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS welcome_email_subject text,
  ADD COLUMN IF NOT EXISTS welcome_email_body text;

UPDATE public.app_settings
SET welcome_email_subject = COALESCE(welcome_email_subject, 'Deine Zugangsdaten für dein Mitarbeiterkonto'),
    welcome_email_body = COALESCE(welcome_email_body, 'Hallo {{ vorname }},

willkommen im Team! Wir haben dein persönliches Mitarbeiterkonto für dich angelegt.

Unten findest du deine Zugangsdaten. Bitte logge dich über den Button ein und fülle im Anschluss deinen Arbeitsvertrag aus und unterschreibe ihn digital.

Bitte bewahre deine Zugangsdaten sicher auf und gib sie nicht an Dritte weiter.

Bei Fragen kannst du dich jederzeit bei uns melden.');

ALTER TABLE public.telegram_recipients ADD COLUMN IF NOT EXISTS notify_contracts boolean NOT NULL DEFAULT true;

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS stelle text;

CREATE TABLE public.interview_blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL,
  blocked_time time without time zone NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (blocked_date, blocked_time)
);

GRANT SELECT, INSERT, DELETE ON public.interview_blocked_slots TO authenticated;
GRANT ALL ON public.interview_blocked_slots TO service_role;

ALTER TABLE public.interview_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view blocked slots"
  ON public.interview_blocked_slots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can create blocked slots"
  ON public.interview_blocked_slots FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete blocked slots"
  ON public.interview_blocked_slots FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE OR REPLACE FUNCTION public.list_booked_interview_slots()
RETURNS TABLE(appointment_date date, appointment_time time without time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT appointment_date, appointment_time
  FROM public.interview_appointments
  WHERE appointment_date >= CURRENT_DATE
  UNION
  SELECT blocked_date, blocked_time
  FROM public.interview_blocked_slots
  WHERE blocked_date >= CURRENT_DATE;
$function$;

CREATE OR REPLACE FUNCTION public.book_interview_slot(_token uuid, _date date, _time time without time zone)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF EXISTS (
    SELECT 1 FROM public.interview_blocked_slots
    WHERE blocked_date = _date AND blocked_time = _time
  ) THEN
    RAISE EXCEPTION 'slot_blocked';
  END IF;

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
$function$;