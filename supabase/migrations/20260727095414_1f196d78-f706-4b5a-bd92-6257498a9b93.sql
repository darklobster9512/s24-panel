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

-- Manager-Zugriff auf den Bewerbungsgespräch-Arbeitsbereich
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

-- Manager-Rolle darf nie per Self-Signup gesetzt werden (Default bleibt 'kunde')
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