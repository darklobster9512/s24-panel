# SMS-Bestätigung bei Buchung + SMS-Erinnerung 1 Stunde vor dem Gespräch

Ergänzt die bestehende seven.io-Integration um zwei weitere automatische SMS an den Bewerber:

1. **Buchungsbestätigung** – sobald der Bewerber seinen Termin auf der öffentlichen Buchungsseite bucht, bekommt er zusätzlich zur Bestätigungs-E-Mail eine SMS mit Datum und Uhrzeit.
2. **Erinnerung 1 Stunde vorher** – automatisch, genau eine Stunde vor dem Termin, mit Datum/Uhrzeit. Wird pro Termin nur einmal versendet und nur, wenn der Termin nicht abgesagt ist.

Beides nutzt den bestehenden Schalter „SMS-Versand aktiviert“, den seven.io API Key und den Absendernamen aus `/superadmin/einstellungen`.

## Einstellungen (`/superadmin/einstellungen`)

Im vorhandenen Abschnitt „SMS · seven.io“ kommen zwei Textvorlagen dazu:

- **SMS-Text Terminbestätigung**, Standard:
  „Hallo {vorname}, dein Bewerbungsgespräch bei {unternehmen} ist bestätigt: {datum} um {uhrzeit} Uhr. Bis dann!“
- **SMS-Text Erinnerung (1 Std. vorher)**, Standard:
  „Hallo {vorname}, Erinnerung: dein Bewerbungsgespräch bei {unternehmen} startet um {uhrzeit} Uhr.“

Platzhalter: `{vorname}`, `{nachname}`, `{unternehmen}`, `{datum}`, `{uhrzeit}`.

## Technische Umsetzung

Datenbank (eine Migration):
- `app_settings`: neue Spalten `sms_confirmation_text`, `sms_reminder_text` (text, mit Default-Vorlagen).
- `interview_appointments`: neue Spalte `sms_reminder_sent_at timestamptz` (Idempotenz der 1h-Erinnerung).

Gemeinsamer SMS-Code:
- Neue Datei `supabase/functions/_shared/sms.ts` mit der bereits in `send-interview-invite` erprobten Logik: `normalizePhone` (E.164, deutscher Fallback, Muster `^\+[1-9]\d{7,14}$`) und `sendSms()` gegen `https://gateway.seven.io/api/sms` (Header `X-Api-Key`, Nummer ohne `+`, Absendername auf 11 alphanumerische Zeichen gekürzt). Jeder Versand schreibt einen Eintrag in `sms_logs` (`sent`, `failed`, `invalid_number`). `send-interview-invite` wird auf diesen gemeinsamen Helfer umgestellt, Verhalten bleibt identisch.

Buchungsbestätigung:
- `supabase/functions/interview-booked-notify/index.ts` sendet nach der Bestätigungs-E-Mail die Bestätigungs-SMS an `applications.handynummer`. Fehler beim SMS-Versand dürfen die Buchung und die E-Mail nie blockieren; das Ergebnis wird als `sms: { ok, error }` mit zurückgegeben.

1-Stunden-Erinnerung:
- Neue Edge Function `interview-sms-reminder` (`verify_jwt = false`): lädt alle Termine mit `sms_reminder_sent_at IS NULL`, deren Startzeitpunkt (Datum + Uhrzeit in `Europe/Berlin`, DST-sicher nach UTC umgerechnet) 55–65 Minuten in der Zukunft liegt, überspringt abgesagte/stornierte Termine, sendet die Erinnerungs-SMS und setzt `sms_reminder_sent_at`.
- Cron-Job `interview-sms-reminder-every-5-min` (`*/5 * * * *`) ruft die Funktion analog zu den bestehenden Reminder-Jobs per `net.http_post` auf.

Die bestehende Telegram-Erinnerung bleibt unverändert (Interview-Telegram bleibt wie zuletzt deaktiviert, Onboarding aktiv).

Frontend:
- `src/pages/superadmin/Einstellungen.tsx`: zwei neue Textfelder im SMS-Abschnitt inkl. Speichern.
