-- 1. Rollen-Enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'kunde', 'mitarbeiter');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  website text,
  company_description text,
  industry text,
  contact_person text,
  street text,
  postal_code text,
  city text,
  vat_id text,
  phone text,
  email text,
  contact_phone text,
  contact_email text,
  logo_url text,
  greeting_text text,
  forwarding_enabled boolean NOT NULL DEFAULT false,
  is_draft boolean NOT NULL DEFAULT false,
  sip_phone_number text,
  sip_server text,
  sip_username text,
  sip_password text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all clients"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read for client-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-logos');

CREATE POLICY "Superadmins can upload client-logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-logos' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update client-logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client-logos' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete client-logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-logos' AND public.has_role(auth.uid(), 'superadmin'));

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

CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, client_id)
);

CREATE INDEX assignments_employee_id_idx ON public.assignments(employee_id);
CREATE INDEX assignments_client_id_idx ON public.assignments(client_id);

GRANT SELECT, INSERT, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can create assignments"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin') AND created_by = auth.uid());

CREATE POLICY "Superadmins can delete assignments"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));