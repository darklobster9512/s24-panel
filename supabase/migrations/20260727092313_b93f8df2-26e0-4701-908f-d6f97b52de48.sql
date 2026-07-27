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