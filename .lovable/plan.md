# Telegram-Notizen-Benachrichtigung: Ursache und Fix

## Ursache (geprüft)
Die Edge Function `call-note-notify` sendet nur an Telegram-Empfänger, bei denen **beides** gilt: aktiv **und** „Notizen" aktiviert. In der Datenbank steht aktuell:

| Chat-ID | Aktiv | Notizen |
|---|---|---|
| -5395784143 | ja | **nein** |
| -5326576110 (Label „Calls") | **nein** | ja |

Kein einziger Empfänger erfüllt beide Bedingungen — deshalb läuft die Funktion durch, findet null Empfänger und sendet nichts. Die Logs der Funktion zeigen entsprechend keine Telegram-Fehler.

## Fix

### 1. Sofortlösung (Daten)
Empfänger „Calls" (-5326576110) aktivieren, damit die Notiz-Benachrichtigungen wieder an diese Gruppe gehen. Alternativ bei -5395784143 den Schalter „Notizen" einschalten — das lässt sich auch selbst unter `/superadmin/telegram` per Schalter erledigen.

### 2. Absicherung gegen Wiederholung
Auf `/superadmin/telegram` wird sichtbar gemacht, wenn eine Benachrichtigungsart keinen einzigen aktiven Empfänger hat:
- Warnhinweis oben auf der Seite, z. B. „Notiz-Benachrichtigungen gehen aktuell an niemanden".
- Inaktive Empfänger optisch abschwächen und ihre Kategorie-Schalter als wirkungslos kennzeichnen.

### 3. Diagnose verbessern
- In `call-note-notify` wird geloggt, wenn null Empfänger gefunden wurden, und in der Antwort `recipients: 0` zurückgegeben.
- Im Frontend (`Erfassen.tsx`, `RecruitmentErfassen.tsx`) wird ein fehlgeschlagener Aufruf nicht mehr nur in die Konsole geschrieben, sondern als dezenter Hinweis-Toast gezeigt („Notiz gespeichert, Telegram-Benachrichtigung fehlgeschlagen"). Das Speichern der Notiz bleibt davon unberührt.

## Technisch
- Datenänderung über die Oberfläche bzw. ein Update auf `public.telegram_recipients`.
- Dateien: `src/pages/superadmin/Telegram.tsx`, `supabase/functions/call-note-notify/index.ts`, `src/pages/mitarbeiter/Erfassen.tsx`, `src/pages/mitarbeiter/RecruitmentErfassen.tsx`.
- Keine Schemaänderung nötig.
