## Ziel

Die Supabase Edge Function `sipgate-webhook` warm halten, damit sipgate `newCall`-Requests nicht mehr in Cold-Start-Timeouts laufen.

## Ursache (bestätigt)

Nicht die DB ist langsam — der Container geht nach ~5–15 Min. Idle in `shutdown` (siehe Logs). Der nächste `newCall` trifft dann einen kalten Container, und sipgates sehr kurzes Timeout-Fenster wird gerissen.

## Umsetzung

1. **Extensions aktivieren** (`pg_cron`, `pg_net`), falls noch nicht aktiv.
2. **Cron-Job anlegen** via `supabase--insert`, der alle 4 Minuten die Function pingt:
   - URL: `https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/sipgate-webhook?token=<SIPGATE_WEBHOOK_TOKEN>`
   - Methode: `POST` mit leerem/minimalem Body
   - Damit der Ping nicht als echter Call in `sipgate_calls` landet, wird die Function so angepasst, dass Requests **ohne** `event`-Feld (bzw. mit `event=keepalive`) einfach mit `<Response/>` beantwortet und ignoriert werden.
3. **`sipgate-webhook/index.ts` minimal anpassen**:
   - In `processWebhookBody`: wenn `event` leer oder `keepalive` ist → früh returnen, keine DB-Writes, kein Warn-Log.
4. **Verifizieren**:
   - Nach Deploy 10 Min. warten, dann Edge-Function-Logs prüfen: es sollten regelmäßig Pings kommen und keine `shutdown`-Events mehr auftauchen.
   - Test-Call über sipgate machen und Response-Zeit in den sipgate Push-API-Logs prüfen.

## Technische Details

- Cron-Ausdruck: `*/4 * * * *` (alle 4 Min. — konservativer als das ~5–15 Min. Idle-Fenster).
- Der Token bleibt in der URL, damit die bestehende Auth-Prüfung greift; keine neuen Secrets nötig.
- Fällt der Cron aus, degradiert das System auf das aktuelle Verhalten (Cold Starts bei seltenen Anrufen) — kein Regressionsrisiko.
- Alternative „echte" Lösungen (Min-Instances) gibt es bei Supabase Edge Functions aktuell nicht; Keep-Warm ist der Standard-Workaround.

## Nicht Teil dieses Plans

- Weitere Latenzoptimierungen im Fast-Path (bereits erledigt).
- Änderungen am Frontend oder anderen Functions.
