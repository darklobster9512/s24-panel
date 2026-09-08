# Fehlende Spalte `notify_notes` nachziehen

## Problem
Der Fehler „Could not find the 'notify_notes' column of 'telegram_recipients' in the schema cache" tritt auf, weil bei der Datenbank-Wiederherstellung die Spalte `notify_notes` auf `telegram_recipients` verloren gegangen ist. Die Edge Function `call-note-notify` und die Seite `/superadmin/telegram` erwarten diese Spalte.

## Fix
Eine kleine Migration:

- `ALTER TABLE public.telegram_recipients ADD COLUMN IF NOT EXISTS notify_notes boolean NOT NULL DEFAULT true;`

Damit:
- haben bestehende Empfänger Notiz-Benachrichtigungen automatisch aktiviert (Standard: an)
- funktionieren `call-note-notify` und der Schalter unter `/superadmin/telegram` wieder

Danach prüfe ich, ob weitere beim Wiederaufbau verloren gegangene Spalten fehlen (kurzer Abgleich der erwarteten Spalten aus den Edge Functions mit dem Ist-Schema, z. B. `reminder_sent_at`, `sms_reminder_sent_at`, `startklar_ab`).

## Technisch
- Eine Migration über das Migrations-Tool (idempotent durch `IF NOT EXISTS`)
- Keine Änderungen am Frontend-Code nötig
