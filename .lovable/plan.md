## Diagnose zuerst — dann Fix

Aktuell wissen wir nur: `newCall` kommt an, danach passiert nichts mehr in der DB. Ob sipgate den `hangup` **überhaupt schickt**, ob er mit anderem Event-Namen / anderem `callId`-Feld ankommt, oder ob unser Parser ihn ignoriert — dazu haben wir keine Logs, weil die Function bei Erfolg still ist. Ohne diese Info raten wir. Deshalb: erst Logging schärfen, dann gezielt fixen.

## Schritt 1 — Diagnose-Logging in `supabase/functions/sipgate-webhook/index.ts`

Jeden eingehenden Request loggen, bevor irgendetwas anderes passiert:

- `console.log("[sipgate-webhook] incoming", { method, contentType, rawBody })` direkt nach dem `req.text()`.
- Nach dem Parsen: `console.log("[sipgate-webhook] parsed", { event, callId, direction, from, to, allFields: fields })`.
- In jedem Zweig (`newcall`, `answer`, `hangup`, else) ein `console.log` mit dem finalen DB-Ergebnis (`data` und `error`).
- Auch den `else`-Zweig mit `console.warn` samt vollem `fields`-Dump — falls sipgate `event=hangUp` (camelCase) oder ein anderes Namensschema sendet, sehen wir es sofort.

Das ist ein kleiner, in sich abgeschlossener Edit an genau einer Datei. Keine Logik-Änderung.

## Schritt 2 — Reproduzieren

- Preview offen lassen, echten Testanruf über sipgate auslösen und wieder auflegen.
- Edge-Function-Logs auslesen. Drei mögliche Befunde:
  1. **Kein Hangup-Request eingegangen** → sipgate schickt ihn nicht. Ursache liegt in der sipgate-Konsole (Push-API-Konfiguration für Hangup nicht aktiviert / falsche Extension). Ich zeige dir dann genau, was in sipgate umzustellen ist.
  2. **Hangup kommt, aber mit anderem Event-Namen / Feldnamen** (z. B. `event=hangUp`, `event=Hangup`, oder `callId` heißt `originalCallId`). → Fix im Parser: case-insensitive Vergleich + Aliases für `callId`.
  3. **Hangup kommt und wird verarbeitet, aber `.update(...).eq('sipgate_call_id', callId)` matcht keine Zeile** (z. B. weil sipgate für `newCall` und `hangup` unterschiedliche IDs schickt — `callId` vs. `origCallId`). → Fix: bei Update sowohl gegen `sipgate_call_id` als auch gegen gespeicherte `raw_payload->>origCallId` matchen, oder beim Insert `origCallId` als Schlüssel bevorzugen.

## Schritt 3 — Gezielter Fix

Basierend auf dem konkreten Log-Output aus Schritt 2 wird genau eine der drei Ursachen adressiert:

- (1) → keine Code-Änderung, Anleitung für sipgate-Konsole.
- (2) → Parser in `sipgate-webhook/index.ts` toleranter machen (Event-Namen normalisieren, Feld-Aliases). 
- (3) → Match-Strategie ändern: `sipgate_call_id` in der DB auf `origCallId ?? callId` normalisieren (Migration nicht nötig, nur Function-Logik).

## Was der Nutzer danach sieht

- `/mitarbeiter/live` erkennt `ringing → answered → ended/missed` in Echtzeit, weil der `hangup`-Pfad sauber durchläuft.
- Kein Timer, kein Cleanup-Cron — der Status kommt aus dem Event, so wie du es willst.

## Nicht Teil dieses Plans

- Client-Timeout in `use-live-calls.ts` und pg_cron-Cleanup (auf deinen Wunsch verworfen).
- UI-Änderungen an `/mitarbeiter/live`.
