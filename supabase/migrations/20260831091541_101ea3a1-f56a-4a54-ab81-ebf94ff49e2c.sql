ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS sms_confirmation_text text DEFAULT 'Hallo {vorname}, dein Bewerbungsgespräch bei {unternehmen} ist bestätigt: {datum} um {uhrzeit} Uhr. Bis dann!',
  ADD COLUMN IF NOT EXISTS sms_reminder_text text DEFAULT 'Hallo {vorname}, Erinnerung: dein Bewerbungsgespräch bei {unternehmen} startet um {uhrzeit} Uhr.';

UPDATE public.app_settings
  SET sms_confirmation_text = COALESCE(sms_confirmation_text, 'Hallo {vorname}, dein Bewerbungsgespräch bei {unternehmen} ist bestätigt: {datum} um {uhrzeit} Uhr. Bis dann!'),
      sms_reminder_text = COALESCE(sms_reminder_text, 'Hallo {vorname}, Erinnerung: dein Bewerbungsgespräch bei {unternehmen} startet um {uhrzeit} Uhr.');

ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS sms_reminder_sent_at timestamp with time zone;