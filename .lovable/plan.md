## Diagnose

Cloudflare macht seinen Job perfekt:

```text
Forwarded to Supabase 200 body length 371 / 176 / 160
```

Der Body kommt an, Supabase antwortet 200. Trotzdem landet nichts in `sipgate_calls`. Grund steht in unseren Edge-Function-Logs:

```text
[sipgate-webhook] failed to read body BadResource: Bad resource ID
```

Weil unsere Function den Body noch immer in einem Background-Task liest:

```ts
runInBackground(async () => {
  bodyText = await req.text();
  await processWebhookBody(bodyText, contentType);
});
return xmlResponse(CALLBACK_RESPONSE_XML);
```

Nach dem `return` ist der Request-Stream im Supabase Edge Runtime nicht mehr gültig → `BadResource` → kein DB-Insert.

Du hast außerdem recht: Da **Cloudflare bereits die XML-Antwort an Sipgate zurückgibt**, sieht Sipgate unsere Supabase-Antwort nie. Unsere Function muss also weder schnell antworten noch überhaupt XML zurückgeben. Sie darf synchron arbeiten.

## Fix

Nur `supabase/functions/sipgate-webhook/index.ts` wird geändert.

### 1. Body synchron lesen, dann verarbeiten, dann antworten

Alter Flow:

```ts
runInBackground(async () => { bodyText = await req.text(); ... });
return xmlResponse(CALLBACK_RESPONSE_XML);
```

Neuer Flow:

```ts
const bodyText = await req.text();
await processWebhookBody(bodyText, contentType);
return new Response("ok", { status: 200 });
```

- Body wird gelesen, solange der Stream existiert → kein `BadResource` mehr.
- `newCall` / `answer` / `hangup` schreiben zuverlässig in `sipgate_calls`.
- Antwort ist nur noch `200 ok` für Cloudflare — Sipgate sieht sie nie, XML wird vom Worker gesendet.

### 2. Aufräumen

- `runInBackground` Helper entfernen, wird nicht mehr gebraucht.
- Der Callback-XML-String (`CALLBACK_RESPONSE_XML`) und `getPublicCallbackUrl` bleiben, falls Sipgate doch mal direkt trifft (`?keepalive=1` bleibt auch drin für den Fall).
- Keep-Alive-Cron ist bereits aus, kein Handlungsbedarf.

## Was **nicht** angefasst wird

- Kein Cloudflare-Worker-Change.
- Kein Frontend-Change.
- Keine DB-Migration.
- Keine Änderung an `pg_cron`.

## Erwartetes Ergebnis nach Deploy

1. Cloudflare forwarded wie bisher (`200 body length …`).
2. Supabase liest Body sofort, verarbeitet, schreibt DB.
3. `/mitarbeiter/live` zeigt neue Anrufe in Echtzeit.
4. In den Edge-Function-Logs erscheinen wieder `[sipgate-webhook] newCall/answer/hangup result`-Zeilen statt `BadResource`.