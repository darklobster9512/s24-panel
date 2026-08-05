ALTER TABLE public.telegram_recipients
  ADD COLUMN IF NOT EXISTS notify_chat boolean NOT NULL DEFAULT false;