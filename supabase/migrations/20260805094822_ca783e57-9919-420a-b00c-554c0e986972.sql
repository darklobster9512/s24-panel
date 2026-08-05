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