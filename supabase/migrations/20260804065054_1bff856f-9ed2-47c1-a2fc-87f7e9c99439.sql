ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS onboarding_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_system text,
  ADD COLUMN IF NOT EXISTS softphone_email text,
  ADD COLUMN IF NOT EXISTS softphone_password text;

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_phone_system_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_phone_system_check
  CHECK (phone_system IS NULL OR phone_system IN ('sipgate','placetel'));