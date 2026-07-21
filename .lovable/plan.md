## Ziel

Der `newCall`-Webhook muss für sipgate extrem schnell eine gültige XML-Antwort liefern, damit `onAnswer` und `onHangup` zuverlässig registriert werden.

## Bestätigter Ist-Zustand

- Der aktuelle `newCall` um 16:59:27 ist in der Edge Function angekommen.
- Die Datenbank wurde aktualisiert: der Call steht als `ringing` in `sipgate_calls`.
- Die Function loggt zwar XML mit `onAnswer` und `onHangup`, aber sipgate meldet trotzdem `Timeout while requesting customer response`.
- Direkter Test gegen die Function liefert XML korrekt zurück, aber die reale sipgate-Anfrage ist empfindlicher gegen Laufzeit/Response-Verhalten.

## Fix-Plan

1. **Ultra-Fast-Path für `newCall`**
   - Bei `event=newCall` nur das Minimum tun:
     - URL-Token prüfen
     - Body lesen und `event/callId` minimal erkennen
     - sofort XML zurückgeben
   - Keine Datenbankarbeit, kein Client-Lookup, kein ausführliches Logging vor dem Return.

2. **Logging vor dem Return massiv reduzieren**
   - Die aktuellen `console.log`-Aufrufe vor dem XML-Return werden für `newCall` entfernt oder in den Hintergrund verschoben.
   - Grund: Logs können in Edge Runtime die Antwort sichtbar verzögern, obwohl der Code logisch schon „fast-path“ ist.

3. **DB-Speicherung wirklich nachgelagert ausführen**
   - `persistNewCall(...)` wird erst nach der XML-Antwort via `EdgeRuntime.waitUntil(...)` eingeplant.
   - Falls `waitUntil` nicht greift, darf der Datenbankjob nicht den Response blockieren.
   - Fehler werden nur im Hintergrund geloggt.

4. **XML kompatibler machen**
   - `Content-Type: text/xml; charset=utf-8` statt `application/xml`, weil manche Telefonie-Webhooks historisch `text/xml` erwarten.
   - Kompakter Body ohne unnötige Antwort-Logs:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response onAnswer="..." onHangup="..."></Response>
```

5. **Answer/Hangup unverändert verarbeiten**
   - `answer` und `hangup` können weiterhin DB-Updates machen.
   - Zusätzlich wird dort akzeptiert, wenn sipgate Follow-up Events ohne Body-Event aber mit bekannten Feldern sendet.

6. **Nach dem Fix testen**
   - Edge Function deployen.
   - Direkten `newCall`-Request testen und Header/Body prüfen.
   - Edge Logs prüfen: reale `newCall` Requests müssen mit sehr niedriger Laufzeit antworten.
   - Hängende `ringing` Testcalls auf `missed` setzen, damit `/mitarbeiter/live` nicht falsch bleibt.