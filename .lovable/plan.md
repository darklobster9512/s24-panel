# sipgate-Webhook: Folge-Events per XML-Response abonnieren

## Kontext — was ist Push API vs. REST API

sipgate hat zwei unabhängige Produkte:

- **REST API** (`api.sipgate.com`) — Polling/Client-initiiert. Nutzen wir **nicht**.
- **Push API = das „Webhooks"-Feature** — sipgate pusht POST-Requests an unsere URL. **Genau das nutzen wir bereits.** Die technischen Docs dazu liegen unter `developer.sipgate.io/push-api` (im sipgate-Menü als „Push API" gelistet, auf der Landingpage `sipgate.io/webhooks` beworben — beides derselbe Mechanismus).

Es sind also keine API-Credentials, kein REST-Client und keine zusätzlichen Panel-Einstellungen nötig. Reine Erweiterung unseres bestehenden Webhook-Endpunkts.

## Ursache des aktuellen Bugs

Aus der Push-API-Referenz wörtlich:

> „In your response to the new call event POST request, you can subscribe to receive following events of the concerned call. Specify these urls via xml-attributes in the response-tag."
>
> - `onAnswer` — POST beim Annehmen
> - `onHangup` — POST beim Beenden

Beispiel aus der Doku:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response onAnswer="https://…/webhook" onHangup="https://…/webhook"/>
```

Unser Endpoint antwortet aktuell mit leerem 200er → sipgate sendet keine Folge-Events → Status bleibt auf „ringing"/„Wartezeit" hängen. Genau das Symptom im Cockpit.

## Änderungen — ausschließlich in `supabase/functions/sipgate-webhook/index.ts`

1. **`xmlResponse(body)`-Helper**: setzt `Content-Type: application/xml`, liefert XML-Prolog + Body.
2. **Callback-URL aus dem eingehenden `req.url` rekonstruieren** (inkl. `?token=<TOKEN>`), damit dieselbe Function für alle Events wiederverwendet wird und keine URL hardcoded ist.
3. **`newCall`-Zweig**: nach DB-Upsert antworten mit
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <Response onAnswer="…?token=…" onHangup="…?token=…"/>
   ```
4. **`answer`/`hangup`/unbekannte Events**: mit leerem `<Response/>`-XML antworten (statt leerem Body) — laut Doku wird valides XML erwartet.
5. Parser, DB-Writes und Logging bleiben unverändert, inkl. `origCallId`-Fallback.

Kein `<Dial>` oder andere Actions — wir wollen den Anruf nicht umleiten, nur Events empfangen. Ein `<Response>` ohne Kinder ist laut Doku zulässig („kein-Action-Zweig").

## Verifikation

1. Nach Deploy einen Testanruf: klingeln → annehmen → auflegen.
2. `sipgate-webhook`-Logs müssen in Reihenfolge zeigen: `event: "newcall"` → `event: "answer"` → `event: "hangup"`.
3. `/mitarbeiter/live` + `/superadmin/anrufe`: Status wechselt live „Wartezeit" → „Aktiv" → „Beendet" (bzw. „Verpasst", wenn nicht angenommen).
4. Falls trotzdem keine Folge-Events kommen: Response-Body im sipgate-Log prüfen und ggf. XML-Namespace `xmlns="http://schemas.sipgate.io/webhookserver/xml/schema/2015"` ergänzen (Doku zeigt ihn im Beispiel, sagt aber nicht explizit „required").

Keine DB-Migration, keine Frontend-Änderung, keine sipgate-Panel-Änderung deinerseits.
