Plan:

1. **Klarstellung der Ursache**
   - Supabase Edge Functions sind serverless. Ein `shutdown` kann nicht verhindert werden.
   - Eine Antwort „bevor die Function bootet“ ist auf Supabase Edge technisch nicht möglich.
   - Der aktuelle 4-Ping-Cron feuert tatsächlich nahezu gleichzeitig, weil `net.http_post` Requests in PostgreSQL asynchron gesammelt und erst am Transaktionsende versendet werden. `pg_sleep(15)` verzögert dadurch nicht jeden einzelnen HTTP-Request so, wie gewollt.

2. **Cron korrekt auf echte 0/15/30/45s Pings umbauen**
   - Den einen `DO`-Block durch vier getrennte Cron-Jobs ersetzen.
   - Jeder Job läuft minütlich, aber mit eigenem Start-Delay:
     - Ping A: sofort
     - Ping B: `pg_sleep(15)` vor dem einen Request
     - Ping C: `pg_sleep(30)` vor dem einen Request
     - Ping D: `pg_sleep(45)` vor dem einen Request
   - Wichtig: pro Job nur **ein** `net.http_post`, damit der Request nach dem jeweiligen Sleep committed und wirklich zeitversetzt rausgeht.

3. **Webhook noch brutaler als reine Sofort-Antwort absichern**
   - Im `sipgate-webhook` bleibt die XML-Antwort der allererste echte Arbeitsweg nach Token-Check.
   - Keine DB-Abfrage, kein Body-Parsing, kein Supabase-Client, kein Import vor der XML-Antwort.
   - Body-Verarbeitung bleibt ausschließlich im Background-Task.
   - Callback-XML bleibt statisch/schnell und mit `application/xml`.

4. **Realistische finale Lösung, falls sipgate trotzdem Cold-Start-Timeouts produziert**
   - Wenn sipgate weiterhin beim ersten Request timeouts meldet, muss die sipgate Webhook-URL vor Supabase geschaltet werden:
     - ein extrem kleiner always-hot/edge Relay, z. B. Cloudflare Worker
     - dieser Relay antwortet sipgate sofort mit XML
     - danach leitet er den Request asynchron an Supabase weiter
   - Das ist die einzige Lösung, die den Supabase-Edge-Boot vollständig aus sipgates Timeout-Fenster nimmt.

5. **Verifikation**
   - Nach Umsetzung prüfen:
     - Edge-Logs: Pings kommen wirklich verteilt bei 0/15/30/45s an
     - sipgate `newCall`: XML-Response bleibt `200 application/xml`
     - keine Änderung an Call-Logik, Status-Mapping, Frontend oder Datenmodell.