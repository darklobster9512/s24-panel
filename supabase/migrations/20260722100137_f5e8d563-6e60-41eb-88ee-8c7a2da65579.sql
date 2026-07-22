
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT NOT NULL,
  handynummer TEXT NOT NULL,
  geburtsdatum DATE NOT NULL,
  staatsangehoerigkeit TEXT NOT NULL,
  anstellung TEXT NOT NULL,
  lebenslauf_path TEXT,
  lebenslauf_filename TEXT,
  lebenslauf_mime TEXT,
  status TEXT NOT NULL DEFAULT 'neu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view applications"
  ON public.applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete applications"
  ON public.applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

-- Storage policies for applications bucket (bucket created via storage_create_bucket tool)
CREATE POLICY "Superadmin can read application files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete application files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'superadmin'));
