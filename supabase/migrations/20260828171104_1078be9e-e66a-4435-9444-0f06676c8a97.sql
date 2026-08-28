DROP POLICY IF EXISTS "Internal interviewers can view interview appointments" ON public.interview_appointments;
CREATE POLICY "Internal interviewers can view interview appointments"
ON public.interview_appointments FOR SELECT
USING (
  has_internal_interviews()
  AND ((appointment_date + appointment_time) AT TIME ZONE 'Europe/Berlin') >= internal_interviews_since()
);

DROP POLICY IF EXISTS "Internal interviewers can update interview appointments" ON public.interview_appointments;
CREATE POLICY "Internal interviewers can update interview appointments"
ON public.interview_appointments FOR UPDATE
USING (
  has_internal_interviews()
  AND ((appointment_date + appointment_time) AT TIME ZONE 'Europe/Berlin') >= internal_interviews_since()
);

DROP POLICY IF EXISTS "Internal interviewers can view applications" ON public.applications;
CREATE POLICY "Internal interviewers can view applications"
ON public.applications FOR SELECT
USING (
  has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ((ia.appointment_date + ia.appointment_time) AT TIME ZONE 'Europe/Berlin') >= internal_interviews_since()
  )
);

DROP POLICY IF EXISTS "Internal interviewers can update applications" ON public.applications;
CREATE POLICY "Internal interviewers can update applications"
ON public.applications FOR UPDATE
USING (
  has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ((ia.appointment_date + ia.appointment_time) AT TIME ZONE 'Europe/Berlin') >= internal_interviews_since()
  )
);