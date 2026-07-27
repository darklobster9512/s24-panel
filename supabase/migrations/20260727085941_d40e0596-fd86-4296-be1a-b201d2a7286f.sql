CREATE TABLE public.telegram_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id text NOT NULL UNIQUE,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  notify_applications boolean NOT NULL DEFAULT true,
  notify_interviews boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_recipients TO authenticated;
GRANT ALL ON public.telegram_recipients TO service_role;

ALTER TABLE public.telegram_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view telegram recipients"
  ON public.telegram_recipients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert telegram recipients"
  ON public.telegram_recipients FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update telegram recipients"
  ON public.telegram_recipients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete telegram recipients"
  ON public.telegram_recipients FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_telegram_recipients_updated_at
  BEFORE UPDATE ON public.telegram_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();