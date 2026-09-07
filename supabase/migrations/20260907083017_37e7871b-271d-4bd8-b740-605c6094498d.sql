CREATE TYPE public.employee_contract_status AS ENUM ('pending_employee', 'pending_admin', 'completed');

CREATE TABLE public.employee_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.contract_templates(id) ON DELETE RESTRICT,
  status public.employee_contract_status NOT NULL DEFAULT 'pending_employee',
  employee_signature_data_url text,
  signed_at timestamptz,
  admin_confirmed_at timestamptz,
  admin_confirmed_by uuid,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_contracts TO authenticated;
GRANT ALL ON public.employee_contracts TO service_role;

ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage all employee contracts"
  ON public.employee_contracts FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employees can view their own contract"
  ON public.employee_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_contracts.employee_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own contract"
  ON public.employee_contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_contracts.employee_id AND e.user_id = auth.uid()
    )
    AND status = 'pending_employee'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_contracts.employee_id AND e.user_id = auth.uid()
    )
    AND status IN ('pending_employee', 'pending_admin')
  );

CREATE TRIGGER update_employee_contracts_updated_at
  BEFORE UPDATE ON public.employee_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Employees can update their own employee row"
  ON public.employees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employees can read their own contract PDF"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contract-assets'
    AND EXISTS (
      SELECT 1
      FROM public.employee_contracts ec
      JOIN public.employees e ON e.id = ec.employee_id
      WHERE e.user_id = auth.uid()
        AND ec.pdf_path = storage.objects.name
    )
  );

CREATE POLICY "Superadmins manage contract-assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (bucket_id = 'contract-assets' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employees can read their assigned template"
  ON public.contract_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.employee_contracts ec
      JOIN public.employees e ON e.id = ec.employee_id
      WHERE ec.template_id = contract_templates.id
        AND e.user_id = auth.uid()
    )
  );

CREATE TABLE public.call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  sipgate_call_id uuid REFERENCES public.sipgate_calls(id) ON DELETE SET NULL,
  anrufer_name text,
  anrufer_nummer text,
  anrufer_email text,
  anliegen text NOT NULL,
  kategorie text,
  prioritaet text NOT NULL DEFAULT 'normal',
  weitergeleitet_an text,
  rueckruf_gewuenscht boolean NOT NULL DEFAULT false,
  rueckruf_zeit text,
  dauer_sekunden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_notes TO authenticated;
GRANT ALL ON public.call_notes TO service_role;

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employee reads own notes" ON public.call_notes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmin reads all notes" ON public.call_notes
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employee inserts own notes" ON public.call_notes
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
  AND public.is_client_assigned_to_me(call_notes.client_id)
);

CREATE POLICY "Superadmin inserts notes" ON public.call_notes
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employee updates own notes" ON public.call_notes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmin updates notes" ON public.call_notes
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employee deletes own notes" ON public.call_notes
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmin deletes notes" ON public.call_notes
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_call_notes_updated_at
BEFORE UPDATE ON public.call_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX call_notes_employee_created_idx ON public.call_notes (employee_id, created_at DESC);
CREATE INDEX call_notes_client_idx ON public.call_notes (client_id);