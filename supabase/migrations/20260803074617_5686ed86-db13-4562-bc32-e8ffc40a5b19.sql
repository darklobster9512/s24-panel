ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS welcome_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS welcome_email_subject text,
  ADD COLUMN IF NOT EXISTS welcome_email_body text;

UPDATE public.app_settings
SET welcome_email_subject = COALESCE(welcome_email_subject, 'Deine Zugangsdaten für dein Mitarbeiterkonto'),
    welcome_email_body = COALESCE(welcome_email_body, 'Hallo {{ vorname }},

willkommen im Team! Wir haben dein persönliches Mitarbeiterkonto für dich angelegt.

Unten findest du deine Zugangsdaten. Bitte logge dich über den Button ein und fülle im Anschluss deinen Arbeitsvertrag aus und unterschreibe ihn digital.

Bitte bewahre deine Zugangsdaten sicher auf und gib sie nicht an Dritte weiter.

Bei Fragen kannst du dich jederzeit bei uns melden.');
