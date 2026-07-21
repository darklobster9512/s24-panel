
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

-- Employees need to update their own personal data during contract wizard
CREATE POLICY "Employees can update their own employee row"
  ON public.employees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employees can view their own employee row"
  ON public.employees FOR SELECT
  USING (user_id = auth.uid());

-- Storage policies for contract-assets bucket: employees can read their own PDF
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
