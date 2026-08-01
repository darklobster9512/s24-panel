ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS outbound_recruitment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS caller_api_key text;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_recruitment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS call_script_path text;