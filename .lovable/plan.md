## Ziel

Nach erfolgreicher Terminbuchung auf `/bewerbungsgespraech/:token` bekommt der Bewerber automatisch eine Bestätigungs-Mail mit Datum und Uhrzeit – im gleichen Layout wie die bestehenden Mails (dunkelblauer Header, grüner Akzentstreifen, Ablauf-Card, Footer). Betreff und Text sind unter **Einstellungen** pflegbar, inklusive Vorschau.

## Datenbank

Migration auf `public.app_settings` (Singleton-Tabelle, keine neue Tabelle, keine RLS-Änderung nötig):
- `confirmation_email_enabled boolean not null default true`
- `confirmation_email_subject text` (Default: „Ihr Termin bei Sekretariat24 ist bestätigt")
- `confirmation_email_body text` (Default-Text mit Siezen und vollem Namen, passend zu den bestehenden Mails)

## Backend

`supabase/functions/interview-booked-notify/index.ts` erweitern (die Funktion wird nach der Buchung bereits vom öffentlichen Buchungs-Flow aufgerufen und läuft mit Service-Role):
- Nach der Telegram-Benachrichtigung: `app_settings` laden (Resend-Key, Absender, `confirmation_email_*`, Firmendaten, Akzentfarbe, Logo-Text).
- Abbruch ohne Fehler, wenn `confirmation_email_enabled = false` oder kein Resend-Key hinterlegt ist (Buchung darf nie fehlschlagen).
- HTML-Renderer wie in `send-interview-invite` wiederverwenden, aber:
  - **kein** Button (der Termin steht ja fest) – stattdessen eine Termin-Card mit Datum + Uhrzeit direkt unter dem Text.
  - Ablauf-Schritte: 1. Termin notieren, 2. Gespräch (ca. 20–30 Min.), 3. Rückmeldung.
- Platzhalter: `{{vorname}}`, `{{nachname}}`, `{{voller_name}}`, `{{email}}`, `{{datum}}` (z. B. „12. August 2026"), `{{uhrzeit}}` (z. B. „14:30"), `{{wochentag}}`.
- Versand über Resend an `applications.email`, Fehler nur loggen und `ok: true` zurückgeben.

## Frontend

`src/lib/applicationEmail.ts`: optionales Feld `infoCard?: { label: string; lines: string[] }` ergänzen, damit die Termin-Card (Datum/Uhrzeit) sowohl in der Vorschau als auch – als gespiegelter Code – in der Edge Function identisch rendert.

`src/pages/superadmin/Einstellungen.tsx`:
- Neues Panel **„Bewerbungsgespräch · Terminbestätigung"** unter dem Einladungs-Panel: Switch (aktiv/inaktiv), Betreff, Nachricht (Textarea), Platzhalter-Hinweis, Speichern + Vorschau.
- Zweiter Vorschau-Dialog analog zum bestehenden, mit Beispielwerten (Datum/Uhrzeit) und der Termin-Card statt Button.
- `Settings`-Typ und `previewVars` um die neuen Felder erweitern.

## Hinweise

- Die Buchungsseite selbst ändert sich nicht; der Aufruf von `interview-booked-notify` existiert dort bereits.
- Bei „Termin ändern" wird die Funktion erneut aufgerufen → der Bewerber bekommt eine neue Bestätigung mit dem aktualisierten Termin. Das ist gewollt; sag Bescheid, falls das unterdrückt werden soll.
