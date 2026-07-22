ALTER TABLE public.app_settings
  ALTER COLUMN application_email_body SET DEFAULT E'Hallo {{vorname}} {{nachname}},\n\nvielen Dank für deine Bewerbung bei Sekreteriat24.\n\nWir haben deine Unterlagen erhalten und prüfen sie sorgfältig. In Kürze melden wir uns persönlich bei dir zurück.\n\nMit freundlichen Grüßen\nDein Team von Sekreteriat24';

UPDATE public.app_settings
SET application_email_body = E'Hallo {{vorname}} {{nachname}},\n\nvielen Dank für deine Bewerbung bei Sekreteriat24.\n\nWir haben deine Unterlagen erhalten und prüfen sie sorgfältig. In Kürze melden wir uns persönlich bei dir zurück.\n\nMit freundlichen Grüßen\nDein Team von Sekreteriat24'
WHERE application_email_body IS NULL
   OR application_email_body ILIKE '%vielen Dank für deine Bewerbung. Wir haben deine Unterlagen erhalten und melden uns in Kürze.%';
