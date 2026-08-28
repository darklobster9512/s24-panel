ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS internal_interviews_since timestamptz;

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

UPDATE public.employees
SET internal_interviews_since = now()
WHERE internal_interviews = true AND internal_interviews_since IS NULL;

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

DROP POLICY IF EXISTS "Internal interviewers can view interview appointments" ON public.interview_appointments;
CREATE POLICY "Internal interviewers can view interview appointments"
ON public.interview_appointments FOR SELECT TO authenticated
USING (
  public.has_internal_interviews()
  AND booked_at >= public.internal_interviews_since()
);

DROP POLICY IF EXISTS "Internal interviewers can update interview appointments" ON public.interview_appointments;
CREATE POLICY "Internal interviewers can update interview appointments"
ON public.interview_appointments FOR UPDATE TO authenticated
USING (
  public.has_internal_interviews()
  AND booked_at >= public.internal_interviews_since()
)
WITH CHECK (
  public.has_internal_interviews()
  AND booked_at >= public.internal_interviews_since()
);

DROP POLICY IF EXISTS "Internal interviewers can view applications" ON public.applications;
CREATE POLICY "Internal interviewers can view applications"
ON public.applications FOR SELECT TO authenticated
USING (
  public.has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ia.booked_at >= public.internal_interviews_since()
  )
);

DROP POLICY IF EXISTS "Internal interviewers can update applications" ON public.applications;
CREATE POLICY "Internal interviewers can update applications"
ON public.applications FOR UPDATE TO authenticated
USING (
  public.has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ia.booked_at >= public.internal_interviews_since()
  )
)
WITH CHECK (
  public.has_internal_interviews()
  AND EXISTS (
    SELECT 1 FROM public.interview_appointments ia
    WHERE ia.application_id = applications.id
      AND ia.booked_at >= public.internal_interviews_since()
  )
);