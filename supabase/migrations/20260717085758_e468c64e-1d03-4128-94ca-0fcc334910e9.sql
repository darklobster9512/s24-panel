ALTER TABLE public.clients
  ADD COLUMN sip_phone_number text,
  ADD COLUMN sip_server text,
  ADD COLUMN sip_username text,
  ADD COLUMN sip_password text;