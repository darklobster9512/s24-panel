# Telegram-Benachrichtigung bei neuer Call-Notiz

Bei jeder gespeicherten Anruf-Notiz geht eine Telegram-Nachricht raus – inklusive des Mitarbeiters, der den Anruf geführt hat.

## Steuerung
- Neue Spalte `notify_notes` (an/aus, Standard: an) bei den Telegram-Empfängern
- Neuer Schalter unter `/superadmin/telegram`, um Notiz-Benachrichtigungen pro Empfänger zu aktivieren

## Inhalt der Nachricht

**A) Eingehende Anrufe (sipgate)**
- Kunde, für den der Anruf entgegengenommen wurde
- Mitarbeiter, der den Anruf geführt hat
- Name des Anrufers
- Telefonnummer des Anrufers
- Angerufene Nummer
- Gesprächsdauer
- Notiz (inkl. Kategorie und Priorität)

**B) Outbound Recruitment-Anrufe**
- Kunde, für den der Anruf gemacht wurde
- Mitarbeiter, der den Anruf geführt hat
- Name des Bewerbers
- Telefonnummer des Bewerbers
- Ergebnis: Erfolgreich oder Fehlgeschlagen
- Gesprächsdauer
- Notiz

## Vorschau der Nachrichten

**A) Eingehender Anruf**

```text
📞 Neue Anruf-Notiz (Inbound)

Kunde: Musterfirma GmbH
Mitarbeiterin: Lisa Meier
Anrufer: Thomas Berger
Nummer: +49 170 1234567
Angerufen: +49 30 987654
Dauer: 04:12

Kategorie: Terminanfrage · Priorität: Hoch
Notiz:
Möchte Rückruf am Dienstag zwischen 10 und 12 Uhr wegen Angebot.
```

**B) Outbound Recruitment-Anruf**

```text
📤 Neue Anruf-Notiz (Recruitment)

Kunde: Musterfirma GmbH
Mitarbeiterin: Lisa Meier
Bewerber: Jonas Klein
Nummer: +49 160 7654321
Ergebnis: ✅ Erfolgreich
Dauer: 06:35

Notiz:
Interesse an Teilzeit 22,5 Std., Bewerbungsgespräch für Donnerstag vereinbart.
```


## Technische Umsetzung
- Migration: `ALTER TABLE public.telegram_recipients ADD COLUMN notify_notes boolean NOT NULL DEFAULT true`
- Neue Edge Function `call-note-notify`: erhält `note_id`, prüft das Auth-Token, lädt die Notiz mit Joins auf `clients`, `employees` (Vor-/Nachname) und `sipgate_calls`, baut den Text und sendet ihn über die bestehende `telegram-notify`-Funktion an alle Empfänger mit `notify_notes = true`
- Aufruf per `supabase.functions.invoke('call-note-notify', ...)` nach erfolgreichem Speichern in `src/pages/mitarbeiter/Erfassen.tsx` (Inbound) und `RecruitmentErfassen.tsx` (Outbound); Fehler beim Versand blockieren das Speichern nicht
- UI-Schalter in `src/pages/superadmin/Telegram.tsx` analog zu den bestehenden Schaltern
