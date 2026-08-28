ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS internal_interviews boolean NOT NULL DEFAULT false;

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

-- interview_appointments
DROP POLICY IF EXISTS "Internal interviewers can view interview appointments" ON public.interview_appointments;
CREATE POLICY "Internal interviewers can view interview appointments"
ON public.interview_appointments FOR SELECT TO authenticated
USING (public.has_internal_interviews());

DROP POLICY IF EXISTS "Internal interviewers can update interview appointments" ON public.interview_appointments;
CREATE POLICY "Internal interviewers can update interview appointments"
ON public.interview_appointments FOR UPDATE TO authenticated
USING (public.has_internal_interviews())
WITH CHECK (public.has_internal_interviews());

-- applications
DROP POLICY IF EXISTS "Internal interviewers can view applications" ON public.applications;
CREATE POLICY "Internal interviewers can view applications"
ON public.applications FOR SELECT TO authenticated
USING (public.has_internal_interviews());

DROP POLICY IF EXISTS "Internal interviewers can update applications" ON public.applications;
CREATE POLICY "Internal interviewers can update applications"
ON public.applications FOR UPDATE TO authenticated
USING (public.has_internal_interviews())
WITH CHECK (public.has_internal_interviews());

-- Lebenslauf-Dateien
DROP POLICY IF EXISTS "Internal interviewers can read application files" ON storage.objects;
CREATE POLICY "Internal interviewers can read application files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'applications' AND public.has_internal_interviews());

UPDATE public.interview_appointments SET status = 'mailbox' WHERE status = 'abgesagt';