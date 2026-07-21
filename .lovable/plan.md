## Diagnose

Der Call von **16:42:30/16:42:31** ist bei der Edge Function angekommen und wurde mit **HTTP 200** beantwortet. Im Log steht auch korrekt:

```text
<Response onAnswer="...sipgate-webhook?..." onHangup="...sipgate-webhook?..." />
```

Der kritische Punkt: Die Function brauchte für diesen Request ca. **1499ms**. Aktuell macht `newCall` erst Datenbank-Operationen und gibt danach die XML-Callback-URLs zurück. Wenn sipgate die XML-Antwort zeitlich/inhaltlich nicht schnell genug akzeptiert, registriert sipgate keine `onAnswer`/`onHangup` Callback-URLs und zeigt dann genau diese Meldung.

## Fix-Plan

1. **`newCall` fast-path einbauen**
   - Bei `event=newCall` sofort die XML-Antwort mit `onAnswer` und `onHangup` erzeugen.
   - Keine Datenbank-Abfragen vor der XML-Antwort.
   - Dadurch bekommt sipgate die Callback-URLs maximal schnell.

2. **DB-Schreibarbeit nach hinten schieben**
   - Das Speichern des neuen Calls (`sipgate_calls.upsert`) läuft im Hintergrund via `EdgeRuntime.waitUntil(...)`.
   - Falls `waitUntil` nicht verfügbar ist, wird ein sicherer Fallback genutzt.
   - Fehler beim Speichern werden geloggt, blockieren aber nie die sipgate XML-Antwort.

3. **XML robuster machen**
   - `Content-Type` auf `application/xml; charset=utf-8` setzen.
   - Zusätzlich `Cache-Control: no-store` setzen.
   - XML minimal halten:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response onAnswer="..." onHangup="..."></Response>
```

4. **Answer/Hangup unverändert weiterverarbeiten**
   - `answer` und `hangup` dürfen weiterhin DB-Updates machen, weil dort keine neuen Callback-URLs registriert werden müssen.
   - Status-Mapping bleibt: `answer` -> intern `answered`, `hangup` -> intern `ended`/`missed`.

5. **Test danach**
   - Deployed Edge Function direkt mit einem simulierten `newCall` testen.
   - Prüfen, ob Antwort sofort XML mit beiden Callback-URLs enthält.
   - Danach aktuellen Edge-Function-Log und HTTP-Latenz prüfen.