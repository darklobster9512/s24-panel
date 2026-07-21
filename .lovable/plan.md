## Ziel
Die sipgate-Fehler „Answer/Hangup callback was skipped because no callback URL was configured“ beheben, damit `answer`- und `hangup`-Events zuverlässig ankommen und `/mitarbeiter/live` den Status korrekt aktualisiert.

## Aktueller Stand aus Prüfung
- Die Function antwortet aktuell bei `newCall` mit:
  `<Response onAnswer="https://.../functions/v1/sipgate-webhook?..." onHangup="https://.../functions/v1/sipgate-webhook?..."></Response>`
- Die Logs zeigen nur `newCall`-Requests, keine echten `answer`-/`hangup`-Requests.
- Die sipgate-Doku zeigt die Follow-up-Beispiele als self-closing Root-Tag:
  `<Response onAnswer="http://.../answer" />` und `<Response onHangup="http://.../hangup" />`

## Umsetzung
1. **XML-Response wieder strikt nach sipgate-Beispiel bauen**
   - Für `newCall` self-closing Root-Tag nutzen:
     `<Response onAnswer="..." onHangup="..." />`
   - Content-Type bei `application/xml` lassen.
   - XML-Prolog beibehalten.

2. **Separate Callback-URLs einführen**
   - `onAnswer` zeigt auf dieselbe Edge Function, aber mit zusätzlichem Query-Parameter `callback=answer`.
   - `onHangup` zeigt auf dieselbe Edge Function, aber mit `callback=hangup`.
   - Das macht die URLs für sipgate eindeutiger und erleichtert Logs/Debugging.

3. **Event-Fallback ergänzen**
   - Falls sipgate beim Follow-up-POST aus irgendeinem Grund kein `event` mitsendet, wird `callback=answer` bzw. `callback=hangup` als Fallback genutzt.
   - Bestehende normale `event=answer`/`event=hangup` Logik bleibt unverändert.

4. **Direkt deployed testen**
   - Function deployen.
   - Mit Edge-Function-Testcalls prüfen, dass `newCall` eine XML mit beiden Callback-URLs ausliefert.
   - Simulierte `answer`- und `hangup`-POSTs gegen die neuen Callback-URLs testen.

5. **Danach echter sipgate-Test**
   - Du behältst im sipgate-Panel weiterhin nur diese URL als Haupt-WebHook:
     `https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/sipgate-webhook?token=DEIN_TOKEN`
   - Nach einem echten Testanruf prüfen wir die Logs auf `event=answer` und `event=hangup`.