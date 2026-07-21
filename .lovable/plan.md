## Problem

sipgate meldet: „Answer callback was skipped because no callback URL was configured". Das bedeutet, sipgate akzeptiert unsere XML-Antwort auf `newCall` nicht als gültige Callback-Registrierung für `onAnswer`/`onHangup`.

Aus den Logs sehen wir, dass wir aktuell antworten mit:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response onAnswer="https://.../sipgate-webhook?token=..." onHangup="https://.../sipgate-webhook?token=..."/>
```

Zwei bekannte Fallstricke bei sipgate.io Push-API:

1. **Self-closing Tag** — sipgates Parser ist historisch strikt und erwartet oft `<Response ...></Response>` statt `<Response .../>`.
2. **Fehlender Content-Type / falscher Encoding-Header** — sipgate erwartet `application/xml` (nicht `application/xml; charset=utf-8` in manchen Fällen) und exakt UTF-8 ohne BOM.
3. **URL-Encoding des `&` im Token-Query-String** — der Token enthält keine Sonderzeichen, aber falls das Attribut das `&` nicht als `&amp;` escaped wäre es ein Problem (bereits gemacht via `escapeXmlAttribute`).

## Fix

Anpassung in `supabase/functions/sipgate-webhook/index.ts`:

1. `<Response>` bei `newCall` als offenes Tag rendern, nicht self-closing:
   ```xml
   <Response onAnswer="..." onHangup="..."></Response>
   ```
2. Content-Type auf `application/xml` reduzieren (ohne `charset=utf-8` Suffix), da sipgate darauf empfindlich reagieren kann.
3. Zusätzlich `onAnswer`/`onHangup` mit HTTP-Methode absichern: sipgate erwartet dass die Callback-URL per POST erreichbar ist — unser Handler tut das bereits, aber wir loggen die eingehende Methode für Verifizierung.
4. Ausgabe der final gesendeten XML-Bytes ins Log, damit wir bei nächstem Testanruf sofort verifizieren können.

## Verifizierung

Nach Deploy:
- Testanruf durchführen (klingeln → annehmen → auflegen)
- Edge Function Logs prüfen: es müssen `answer` und `hangup` Events ankommen
- sipgate Dashboard: „Answer callback was skipped" darf nicht mehr erscheinen

## Technische Details

Nur die Response-Renderfunktion für `newcall` und die Header werden angepasst. Keine DB-Änderungen, keine Frontend-Änderungen.