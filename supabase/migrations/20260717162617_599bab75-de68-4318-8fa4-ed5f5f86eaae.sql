
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
