CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  monthly_salary numeric(10,2) NOT NULL DEFAULT 0,
  content_html text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage contract templates"
  ON public.contract_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER trg_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.company_signature (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  signer_name text NOT NULL DEFAULT '',
  signer_title text NOT NULL DEFAULT '',
  signature_url text,
  signature_source text NOT NULL DEFAULT 'generated' CHECK (signature_source IN ('generated','uploaded')),
  signature_style text CHECK (signature_style IN ('elegant','professional','cursive','bold')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_signature TO authenticated;
GRANT ALL ON public.company_signature TO service_role;

ALTER TABLE public.company_signature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage company signature"
  ON public.company_signature FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER trg_company_signature_updated_at
  BEFORE UPDATE ON public.company_signature
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Superadmins read contract-assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins insert contract-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins update contract-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins delete contract-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE OR REPLACE FUNCTION public.is_client_assigned_to_me(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.employees e ON e.id = a.employee_id
    WHERE a.client_id = _client_id
      AND e.user_id = auth.uid()
  )
$$;

CREATE POLICY "Employees can view assigned clients"
ON public.clients
FOR SELECT
TO authenticated
USING (public.is_client_assigned_to_me(id));

CREATE POLICY "Employees can view own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = assignments.employee_id
      AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can view own record"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

ALTER TABLE public.clients
  DROP COLUMN IF EXISTS sip_phone_number,
  DROP COLUMN IF EXISTS sip_server,
  DROP COLUMN IF EXISTS sip_username,
  DROP COLUMN IF EXISTS sip_password;

CREATE TABLE public.client_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (phone_number)
);
CREATE INDEX client_phone_numbers_client_idx ON public.client_phone_numbers(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_phone_numbers TO authenticated;
GRANT ALL ON public.client_phone_numbers TO service_role;

ALTER TABLE public.client_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin manages phone numbers"
ON public.client_phone_numbers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employees read numbers of assigned clients"
ON public.client_phone_numbers FOR SELECT
TO authenticated
USING (public.is_client_assigned_to_me(client_id));

CREATE TRIGGER trg_client_phone_numbers_updated_at
BEFORE UPDATE ON public.client_phone_numbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sipgate_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sipgate_call_id TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  from_number TEXT,
  to_number TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  answered_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  handled_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','answered','missed','ended')),
  caller_name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sipgate_calls_client_idx ON public.sipgate_calls(client_id);
CREATE INDEX sipgate_calls_status_idx ON public.sipgate_calls(status);
CREATE INDEX sipgate_calls_started_at_idx ON public.sipgate_calls(started_at DESC);

GRANT SELECT, UPDATE ON public.sipgate_calls TO authenticated;
GRANT ALL ON public.sipgate_calls TO service_role;

ALTER TABLE public.sipgate_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin reads all calls"
ON public.sipgate_calls FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employees read calls of assigned clients"
ON public.sipgate_calls FOR SELECT
TO authenticated
USING (
  client_id IS NOT NULL
  AND public.is_client_assigned_to_me(client_id)
);

CREATE POLICY "Employees claim assigned calls"
ON public.sipgate_calls FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR (client_id IS NOT NULL AND public.is_client_assigned_to_me(client_id))
)
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR (client_id IS NOT NULL AND public.is_client_assigned_to_me(client_id))
);

CREATE TRIGGER trg_sipgate_calls_updated_at
BEFORE UPDATE ON public.sipgate_calls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.sipgate_calls;
ALTER TABLE public.sipgate_calls REPLICA IDENTITY FULL;

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sipgate_user_id TEXT;
CREATE INDEX IF NOT EXISTS employees_sipgate_user_id_idx ON public.employees(sipgate_user_id);