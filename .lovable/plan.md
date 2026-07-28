## Ziel

1. Telefonnummern in allen Telegram-Nachrichten mit einem Tap kopierbar machen.
2. 5 Minuten vor jedem gebuchten Bewerbungsgespräch automatisch eine Erinnerung an die aktiven Telegram-Empfänger senden.

## 1. Tap-to-Copy Telefonnummern

Telegram macht `<code>`-Text mit einem Tap kopierbar. Alle Nummern-Ausgaben werden darauf umgestellt:

- `telegram-notify`: Nummern in der Bewerbungs- und der Bewerbungsgespräch-Nachricht (`📱 …`) in `<code>` einfassen.
- `telegram-webhook`: Nummern in der `/kalender`-Liste ebenfalls in `<code>` einfassen.
- Layout und Reihenfolge bleiben unverändert.

## 2. Erinnerung 5 Minuten vor dem Termin

**Neue Edge Function `interview-reminder`**
- Läuft minütlich, arbeitet in Berlin-Zeit.
- Sucht Termine, deren Startzeit 5 Minuten in der Zukunft liegt (Zeitfenster von einer Minute, damit nichts doppelt oder gar nicht gesendet wird).
- Sendet an alle aktiven `telegram_recipients` mit `notify_interviews = true`.
- Nachricht im bestehenden Stil, z. B.:

```text
⏰ Bewerbungsgespräch in 5 Minuten

Max Mustermann
🗓 Dienstag, 28.07.2026 · 14:30 Uhr
📱 0170 1234567   (tap-to-copy)
```

**Schutz vor Doppelversand**
- Neue Spalte `reminder_sent_at` (timestamptz, nullable) auf `interview_appointments`.
- Die Function verarbeitet nur Termine mit `reminder_sent_at IS NULL` und setzt die Spalte nach erfolgreichem Versand.

**Zeitplanung**
- `pg_cron`-Job, der `interview-reminder` jede Minute per `pg_net` aufruft (analog zum bestehenden Keep-Warm-Job).

## Technische Details

- Migration: `ALTER TABLE public.interview_appointments ADD COLUMN reminder_sent_at timestamptz;`
- Cron-Eintrag wird per Insert-Tool angelegt (enthält projektspezifische URL/Key).
- Die Function nutzt den Service-Role-Key und `TELEGRAM_BOT_TOKEN` wie die bestehenden Telegram-Functions; keine neuen Secrets nötig.
- Storniert/abgesagte Termine (Status entsprechend) werden von der Erinnerung ausgeschlossen.
