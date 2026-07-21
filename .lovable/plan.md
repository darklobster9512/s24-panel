## Befund

Ja, dein sipgate-Log bestätigt den Fehler eindeutig.

sipgate sendet `answer` und `hangup`, aber an diese von uns zurückgegebene URL:

```text
http://erwuhvouxkaxczzbjrle.supabase.co/sipgate-webhook?token=...
```

Diese URL ist falsch für Supabase Edge Functions und endet deshalb mit `404`.

Richtig ist:

```text
https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/sipgate-webhook?token=...
```

`newCall` kommt bei uns an, aber unsere XML-Antwort registriert die Folgeevents auf dem falschen Pfad. Deshalb sieht sipgate `answer` und `hangup`, unsere Function aber nicht.

## Plan

1. **Callback-URL in der Edge Function fixen**
   - In `supabase/functions/sipgate-webhook/index.ts` die Callback-URL nicht mehr aus `url.origin + url.pathname` bauen.
   - Stattdessen aus `SUPABASE_URL` die korrekte öffentliche Function-URL erzeugen:

   ```text
   ${SUPABASE_URL}/functions/v1/sipgate-webhook?token=...
   ```

   - Damit wird automatisch `https` und der korrekte `/functions/v1/...` Pfad verwendet.

2. **XML-Antwort sauber halten**
   - Bei `newCall` zurückgeben:

   ```xml
   <Response onAnswer="https://.../functions/v1/sipgate-webhook?token=..." onHangup="https://.../functions/v1/sipgate-webhook?token=..."/>
   ```

   - `onData` entfernen, weil wir es für diesen Flow nicht brauchen.

3. **Bestehende Statuslogik weiterverwenden**
   - `answer` setzt `sipgate_calls.status = answered`.
   - `hangup` setzt `status = ended` oder `missed`.
   - Matching über `callId` bleibt, weil dein sipgate-Log zeigt, dass `answer` und `hangup` dieselbe `callId` wie `newCall` senden.

4. **Deploy und Test**
   - Edge Function deployen.
   - Mit einem simulierten `newCall` prüfen, dass die XML-Antwort die richtige URL enthält.
   - Danach echten Testanruf machen.
   - In den Logs müssen danach `answer result` und `hangup result` auftauchen statt sipgate-404.