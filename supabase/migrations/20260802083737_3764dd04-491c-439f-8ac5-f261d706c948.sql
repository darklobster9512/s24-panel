ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS call_script_my_name text,
  ADD COLUMN IF NOT EXISTS call_script_company_name text;