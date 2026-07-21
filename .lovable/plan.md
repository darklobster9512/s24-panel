## Umsetzung: XML sofort raus + Keep-Warm auf 60 s mit POST-Body

### 1. Edge Function `sipgate-webhook` – XML antworten, bevor der Body gelesen wird

In `supabase/functions/sipgate-webhook/index.ts` den Handler-Block am Ende (aktuell Zeilen 332–347) so umbauen, dass `req.text()` **nach** dem Response im Background-Task läuft:

```ts
if (req.method !== "POST") return xmlResponse(EMPTY_RESPONSE_XML);

const contentType = req.headers.get("content-type") ?? "";

// sipgate hat ~1 s Timeout — Body-Read darf die XML-Antwort nicht blockieren.
runInBackground(async () => {
  let bodyText = "";
  try {
    bodyText = await req.text();
  } catch (e) {
    console.error("[sipgate-webhook] failed to read body", e);
    return;
  }
  await processWebhookBody(bodyText, contentType);
});

return xmlResponse(callbackResponseXml);
```

Sonst wird an der Function nichts geändert (kein Umschreiben der Handler-Logik, keine Änderungen an Parsing, DB-Writes, Callback-URLs).

### 2. Keep-Warm-Cron auf 60 s mit POST-Body

Den bestehenden `pg_cron`-Job aktualisieren (via `supabase--insert` SQL-Ausführung, weil URL/Key user-spezifisch sind):

- Alten 4-min-Job `sipgate-webhook-keepalive` mit `cron.unschedule(...)` entfernen.
- Neu anlegen: **jede Minute** ein `net.http_post` an `…/functions/v1/sipgate-webhook?keepalive=1` mit `Content-Type: application/json` und einem kleinen Body (`{"ping": <timestamp>}`), damit Cloudflare den TLS-Tunnel nicht schließt.

Der bestehende Keepalive-Handler in der Function (Zeile 312) returnt bereits `"ok"` für `?keepalive=1` und ignoriert den Body — keine Code-Änderung nötig, nur der Cron.

### Was NICHT angefasst wird

- Kein Frontend-Change.
- Keine DB-Schema-Änderung.
- Keine Änderungen an `processWebhookBody`, `persistNewCall`, Lookup-Funktionen, XML-Format, Callback-URL-Bau.
- Kein Aufräumen alter `sipgate_calls`-Zeilen.

Bereit, in Build-Mode umzusetzen.