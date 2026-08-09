# Onboarding-Termine im Superadmin-Panel

Neuer Reiter `/superadmin/onboarding-termine`, in dem Onboarding-Termine zu bestehenden Bewerbungen angelegt, in einer Kalender-/Terminliste angezeigt und 5 Minuten vorher per Telegram erinnert werden.

## Funktionen

1. Sidebar-Reiter "Onboarding-Termine" (Gruppe Betrieb, unter Bewerbungsgespräche) mit Badge für heutige Onboarding-Termine.
2. Übersichtsseite im gleichen Stil wie Bewerbungsgespräche:
   - Ansichten Bevorstehend / Vergangen / Alle, Suche, Statusfilter.
   - Gruppierung nach Tag mit "Heute"/"Morgen"-Labels.
   - Karten/Zeilen mit Name, Kontaktdaten, Stelle, Datum/Uhrzeit, Status und Notiz.
   - Status ändern (Offen, Erledigt, Abgesagt) und Termin löschen.
3. "+ Onboarding-Termin"-Button öffnet ein Popup:
   - Suchleiste über bestehende Bewerbungen (Name, E-Mail, Telefon), Auswahl aus Trefferliste.
   - Die Bewerbungsdaten (Name, E-Mail, Telefon, Stelle) werden zum Zeitpunkt des Speicherns mit im Termin abgelegt.
   - Felder: Datum, Uhrzeit, Notizfeld (z. B. Arbeitstage und Stunden).
   - Speichern legt den Termin an und aktualisiert die Liste.
4. Telegram-Erinnerung 5 Minuten vor dem Termin, im gleichen Mechanismus wie die Bewerbungsgespräch-Erinnerung, aber optisch klar als Onboarding gekennzeichnet (eigene Symbolik, Überschrift "ONBOARDING-TERMIN in 5 Minuten", Anzeige der Notiz/Arbeitszeiten, Button führt auf die Onboarding-Seite).
5. In den Telegram-Einstellungen ein eigener Schalter "Onboarding-Termine" pro Empfänger.

## Technische Details

- Neue Tabelle `public.onboarding_appointments`: `id`, `application_id` (Referenz auf `applications`), Snapshot-Felder `vorname`, `nachname`, `email`, `telefon`, `stelle`, `appointment_date`, `appointment_time`, `notes`, `status` (Default `offen`), `reminder_sent_at`, `created_by`, `created_at`, `updated_at`, `updated_at`-Trigger.
- Migration inkl. GRANTs (`authenticated`, `service_role`) und RLS: Vollzugriff nur für `has_role(auth.uid(), 'superadmin')`.
- Neue Spalte `notify_onboarding` (Default true) in `telegram_recipients`; Schalter in `/superadmin/telegram`.
- Neue Edge Function `onboarding-reminder` (verify_jwt = false), analog zu `interview-reminder`: prüft Termine des heutigen Tages mit `reminder_sent_at is null` und Startzeit 4–5 Minuten in der Zukunft, sendet an alle aktiven Empfänger mit `notify_onboarding`, setzt danach `reminder_sent_at`.
- Neuer Cron-Job (jede Minute) für `onboarding-reminder`, angelegt analog zum bestehenden `interview-reminder-every-minute`-Job.
- Neue Seite `src/pages/superadmin/OnboardingTermine.tsx` plus Route in `src/App.tsx` und Eintrag in `src/components/superadmin/AppSidebar.tsx`.
