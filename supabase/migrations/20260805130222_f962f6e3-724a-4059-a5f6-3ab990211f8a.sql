ALTER TABLE public.chat_agent_settings
  DROP COLUMN IF EXISTS status_text,
  ADD COLUMN IF NOT EXISTS online_from time NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS offline_after time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS auto_offline boolean NOT NULL DEFAULT true;