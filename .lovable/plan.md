## Ziel

Die Telegram-Erinnerung 5 Minuten vor einem Bewerbungsgespräch soll auf einen Blick klar von normalen Benachrichtigungen unterscheidbar sein.

## Änderungen

1. **Nur die Reminder-Function anpassen**
   - Datei: `supabase/functions/interview-reminder/index.ts`
   - Keine Änderung an normalen Bewerbungs-, Buchungs- oder `/kalender`-Nachrichten.

2. **Reminder optisch stärker hervorheben**
   - Eigener Header mit Glocke-Emoji als eindeutiges Markenzeichen:

   ```text
   🔔 TERMIN-ERINNERUNG
   Bewerbungsgespräch in 5 Minuten
   ```

   - Deutlich andere Struktur als die restlichen Notifications.
   - Mehr visuelle Trennung mit auffälligem Divider.
   - Terminzeit, Name und Telefonnummer bleiben sofort sichtbar.

3. **Inhalt beibehalten, aber klarer priorisieren**
   - Name prominent.
   - Datum/Uhrzeit direkt darunter.
   - Telefonnummer weiterhin als `<code>` formatiert, damit sie in Telegram per Tap kopierbar ist.
   - Button „Termin öffnen“ bleibt erhalten.

## Geplantes Format

```text
🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡
🔔 TERMIN-ERINNERUNG
Bewerbungsgespräch in 5 Minuten
🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡

Max Mustermann
Dienstag, 28.07.2026 · 14:30 Uhr
Telefon: 0170 1234567

🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡
```

## Technische Details

- Nur der Message-Text in `interview-reminder` wird geändert.
- HTML-Parse-Mode bleibt aktiv.
- Telefonnummer bleibt als `<code>...</code>` gesetzt.
- Keine Datenbankänderung nötig.
- Danach wird die Edge Function `interview-reminder` neu deployt.