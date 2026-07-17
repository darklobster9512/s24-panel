
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  first_name text,
  last_name text,
  personal_email text,
  personal_phone text,
  login_local_part text,
  login_email text,
  password_plain text,
  contract_type text CHECK (contract_type IN ('vollzeit','teilzeit')),
  start_date date,
  salary numeric(10,2),
  birth_date date,
  birth_place text,
  nationality text,
  marital_status text,
  iban text,
  bic text,
  bank_name text,
  tax_id text,
  social_security_number text,
  health_insurance text,
  is_draft boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX employees_login_email_active_uniq
  ON public.employees (login_email)
  WHERE is_draft = false AND login_email IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all employees"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'::public.app_role));

CREATE TRIGGER employees_set_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
