ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS confirmation_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmation_email_subject text,
  ADD COLUMN IF NOT EXISTS confirmation_email_body text;

UPDATE public.app_settings
SET confirmation_email_subject = COALESCE(confirmation_email_subject, 'Ihr Termin bei Sekretariat24 ist bestätigt'),
    confirmation_email_body = COALESCE(confirmation_email_body,
'Sehr geehrte/r {{voller_name}},

vielen Dank für die Buchung Ihres Bewerbungsgesprächs. Wir freuen uns sehr auf das persönliche Kennenlernen.

Ihr Termin ist hiermit verbindlich bestätigt. Sollten Sie den Termin nicht wahrnehmen können, geben Sie uns bitte rechtzeitig Bescheid.

Mit freundlichen Grüßen
Ihr Team von Sekretariat24');