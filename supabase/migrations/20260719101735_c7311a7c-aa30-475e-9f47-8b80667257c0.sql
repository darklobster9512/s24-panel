ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS sip_phone_number text,
  ADD COLUMN IF NOT EXISTS sip_server text,
  ADD COLUMN IF NOT EXISTS sip_username text,
  ADD COLUMN IF NOT EXISTS sip_password text;

ALTER TABLE public.clients
  DROP COLUMN IF EXISTS sip_phone_number,
  DROP COLUMN IF EXISTS sip_server,
  DROP COLUMN IF EXISTS sip_username,
  DROP COLUMN IF EXISTS sip_password;