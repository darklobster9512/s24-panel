CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view activity log"
ON public.activity_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert activity log"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin') AND actor_user_id = auth.uid());

CREATE INDEX activity_log_created_at_idx ON public.activity_log (created_at DESC);

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS confirmation_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmation_email_subject text,
  ADD COLUMN IF NOT EXISTS confirmation_email_body text;

UPDATE public.app_settings
SET confirmation_email_subject = COALESCE(confirmation_email_subject, 'Ihr Termin bei Sekretariat24 ist bestätigt'),
    confirmation_email_body = COALESCE(confirmation_email_body,
'Sehr geehrte/r {{voller_name}},

vielen Dank für die Buchung Ihres Bewerbungsgesprächs. Wir freuen uns sehr auf das persönliche Kennenlernen.

Ihr Termin ist hiermit verbindlich bestätigt. Sollten Sie den Termin nicht wahrnehmen können, geben Sie uns bitte rechtzeitig Bescheid.

Mit freundlichen Grüßen
Ihr Team von Sekretariat24');

CREATE TABLE public.managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.managers TO authenticated;
GRANT ALL ON public.managers TO service_role;

ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view managers" ON public.managers
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmins can insert managers" ON public.managers
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmins can update managers" ON public.managers
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmins can delete managers" ON public.managers
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_managers_updated_at
BEFORE UPDATE ON public.managers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Managers can view interview appointments" ON public.interview_appointments
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can update interview appointments" ON public.interview_appointments
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can delete interview appointments" ON public.interview_appointments
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can view applications" ON public.applications
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can update applications" ON public.applications
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can view activity log" ON public.activity_log
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can insert activity log" ON public.activity_log
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager') AND actor_user_id = auth.uid());

CREATE POLICY "Managers can view app settings" ON public.app_settings
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can read application files" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'manager'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _requested_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, company)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company'
  );

  _requested_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('kunde', 'mitarbeiter')
      THEN (NEW.raw_user_meta_data->>'role')::public.app_role
    ELSE 'kunde'::public.app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _requested_role);

  RETURN NEW;
END;
$function$;

ALTER TABLE public.interview_appointments ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS start_asap boolean NOT NULL DEFAULT false;