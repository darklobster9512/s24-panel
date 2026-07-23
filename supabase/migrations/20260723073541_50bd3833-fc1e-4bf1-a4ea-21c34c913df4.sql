-- Korrigiere bereits vorhandene Einstellungen (auch wenn Nutzer sie nicht angepasst haben)
UPDATE public.app_settings
SET
  company_name = REPLACE(company_name, 'Sekreteriat', 'Sekretariat'),
  logo_text = REPLACE(logo_text, 'Sekreteriat', 'Sekretariat'),
  application_email_subject = REPLACE(application_email_subject, 'Sekreteriat', 'Sekretariat'),
  application_email_body = REPLACE(application_email_body, 'Sekreteriat', 'Sekretariat');

-- Setze korrigierte Default-Werte für zukünftige Zeilen
ALTER TABLE public.app_settings
  ALTER COLUMN logo_text SET DEFAULT 'Sekretariat24',
  ALTER COLUMN application_email_subject SET DEFAULT 'Deine Bewerbung bei Sekretariat24',
  ALTER COLUMN application_email_body SET DEFAULT 'Hallo {{vorname}},

vielen Dank für deine Bewerbung. Wir haben deine Unterlagen erhalten und melden uns in Kürze.

Viele Grüße
Sekretariat24';