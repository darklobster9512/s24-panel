
-- 1) client_phone_numbers
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

-- 2) sipgate_calls
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

-- Superadmin: full read
CREATE POLICY "Superadmin reads all calls"
ON public.sipgate_calls FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Employees: read calls for their assigned clients
CREATE POLICY "Employees read calls of assigned clients"
ON public.sipgate_calls FOR SELECT
TO authenticated
USING (
  client_id IS NOT NULL
  AND public.is_client_assigned_to_me(client_id)
);

-- Employees: can set themselves as handler (update only on assigned calls)
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

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sipgate_calls;
ALTER TABLE public.sipgate_calls REPLICA IDENTITY FULL;

-- 3) employees.sipgate_user_id
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sipgate_user_id TEXT;
CREATE INDEX IF NOT EXISTS employees_sipgate_user_id_idx ON public.employees(sipgate_user_id);
