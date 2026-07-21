ALTER TABLE public.employees
  DROP COLUMN IF EXISTS sip_phone_number,
  DROP COLUMN IF EXISTS sip_server,
  DROP COLUMN IF EXISTS sip_username,
  DROP COLUMN IF EXISTS sip_password;