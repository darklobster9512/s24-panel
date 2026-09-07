# Wiederherstellung nach Löschung der alten Datenbank

## Stand jetzt (bereits geprüft)

Die neue Datenbank ist bereits vollständig nach dem Bauplan des Projekts neu aufgebaut. Vorhanden sind alle 25 Bereiche:

Kunden, Mitarbeitende, Zuweisungen, Vertragsvorlagen, Unterschrift, Arbeitsverträge, Telefonnummern, Anrufe, Anrufnotizen, Anrufer-Kontakte, Bewerbungen, Bewerbungsgespräche, gesperrte Zeiten, Onboarding-Termine, Livechat (Unterhaltungen, Nachrichten, Agent-Einstellungen), Manager, Profile, Rollen, Einstellungen, Telegram-Empfänger, Kurzlinks, SMS-Protokoll, Aktivitätsprotokoll.

Ebenso sind alle 19 Hintergrundfunktionen neu veröffentlicht (Bewerbung einreichen, Einladung + SMS, Terminbestätigung, Erinnerungen, Telegram, Sipgate-Anrufe, Konten anlegen/löschen, Livechat-Meldungen) und die automatischen Erinnerungs-Prüfläufe (alle 5 Minuten) laufen wieder.

**Wichtig und ehrlich:** Die Struktur ist wiederhergestellt, die **Inhalte nicht**. Aus Protokollen lassen sich keine echten Datensätze zurückholen. Aktuell gibt es 0 Benutzerkonten, 0 Kunden, 0 Mitarbeitende, 0 Vertragsvorlagen, 0 Bewerbungen und keine Telegram-Empfänger.

## Was ich in diesem Schritt mache

1. **Dein Chef-Konto einrichten** – nach deiner Registrierung unter /auth bekommt dein Konto die Geschäftsführer-Rolle, damit du wieder überall hineinkommst.
2. **Grundeinstellungen anlegen** – Firmenname „Sekretariat24“, Akzentfarbe, Standardtexte für Einladungs-, Bestätigungs- und Erinnerungs-Mails/SMS, Gesprächszeiten (Wochentage, Zeitfenster, Takt), Standardeintrag für die Unterschrift und den Livechat-Agenten „Daniel Schreiber“ mit Bürozeiten.
3. **Kunde „aigis one GmbH“ inkl. Recruiting-Skript** wieder anlegen, damit interne Bewerbungsgespräche sofort funktionieren.
4. **Dateiablagen prüfen** – Logos, Bewerbungsunterlagen, Vertragsunterlagen und Gesprächsleitfäden sind angelegt; Logos liegen derzeit geschützt, ich stelle die Anzeige im Panel auf sichere Links um, damit Logos wieder sichtbar sind.
5. **Externe Zugänge kontrollieren** – Telegram-Bot, Sipgate-Webhook, Resend- und seven.io-Schlüssel sind Einstellungen, die ich für dich eintrage, sobald du sie durchgibst.

## Was du wieder selbst eingeben musst

- Kunden und Mitarbeitende (inkl. Zugangsdaten – die alten Passwörter sind weg)
- Vertragsvorlagen und deine Unterschrift
- Telegram-Empfänger (Chat-IDs)
- Resend- und seven.io-Schlüssel in den Einstellungen

## Technische Details

- Schema entspricht den 64 Migrationsdateien im Projekt, inklusive Rollen-Enum (superadmin, kunde, mitarbeiter, manager), aller RLS-Policies, Security-Definer-Helfer (has_role, is_client_assigned_to_me, Buchungs-RPCs, Chat- und Interview-Helfer), Triggern für updated_at und internal_interviews_since sowie Realtime für Anrufe, Notizen, Bewerbungen und Chat.
- Buckets: client-logos (10 MB), applications, contract-assets, call-scripts (je 20 MB), alle privat, da der Workspace öffentliche Buckets sperrt. Logo-Anzeige wird deshalb auf signierte URLs umgestellt.
- Cron: interview-sms-reminder-every-5-min und onboarding-reminder-every-5-min (je 288 Läufe/Tag, nötig für die Erinnerung 1 Stunde vor dem Termin).
- Seed erfolgt über run_sql; Rollenvergabe über user_roles nach Registrierung.
