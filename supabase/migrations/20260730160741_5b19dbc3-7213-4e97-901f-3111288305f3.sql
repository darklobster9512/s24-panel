ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS start_asap boolean NOT NULL DEFAULT false;