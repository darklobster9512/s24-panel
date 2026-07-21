````text
Ziel
sipgate soll die `onAnswer` und `onHangup` Callback-URLs aus der newCall-Antwort wieder akzeptieren.

Bestätigte Ursache
sipgate zeigt beim erfolgreichen `newCall`:
"Response does not have content type application/xml"

Aktuell antwortet die Edge Function mit:
Content-Type: text/xml; charset=utf-8

sipgate erwartet aber strikt:
Content-Type: application/xml

Umsetzung
1. In `supabase/functions/sipgate-webhook/index.ts` die XML-Antwort ändern:
   - von `text/xml; charset=utf-8`
   - auf `application/xml`

2. Keepalive-Response unverändert lassen, weil sie nicht von sipgate verarbeitet wird.

3. Optional minimal verbessern:
   - `Content-Length` muss nicht gesetzt werden.
   - XML-Body bleibt exakt gleich:
     `<Response onAnswer="..." onHangup="..."></Response>`

4. Edge Function deployen.

5. Verifizieren:
   - Test-newCall an die Function senden.
   - Prüfen, dass Response `200 OK` und `Content-Type: application/xml` liefert.
   - Danach echten Test-Anruf machen.
   - Erwartung: sipgate zeigt keinen XML-Error mehr und sendet answer/hangup Events an denselben Webhook.

Datei
- `supabase/functions/sipgate-webhook/index.ts`

Erfolgskriterium
sipgate akzeptiert die Callback-URLs, und die Folgeevents `answer` und `hangup` erscheinen wieder in den Edge Function Logs.
````