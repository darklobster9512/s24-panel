# Upstream-URL der Caller-API umstellen

Die Outbound-Funktionen (Gespräche-Anzeige über `list_interviews`, Panel-Link-Versand über `send_panel_link` / `send_panel_link_email`) laufen im Frontend ausschließlich über die Edge-Function `caller-api-proxy`. Diese leitet die Aufrufe an die eigentliche `caller-api`-Funktion weiter, die auf einem separaten Supabase-Projekt liegt.

Aktuell ist diese Ziel-URL hartcodiert auf das alte Projekt `laozvnaupdecerpvwzmh`. Sie soll auf das neue Projekt `gzgfyuftjvezqjkosntu` umgestellt werden.

## Änderung

`supabase/functions/caller-api-proxy/index.ts` (Zeile 4):

```ts
// alt
const UPSTREAM = 'https://laozvnaupdecerpvwzmh.supabase.co/functions/v1/caller-api';
// neu
const UPSTREAM = 'https://gzgfyuftjvezqjkosntu.supabase.co/functions/v1/caller-api';
```

Keine weiteren Stellen: Alle anderen Edge-Functions und das Frontend verwenden `Deno.env.get('SUPABASE_URL')` bzw. `supabase.functions.invoke("caller-api-proxy")`, also das verbundene Projekt — keine hartcodierte URL.

## Nach der Änderung

- `caller-api-proxy` per `deploy_edge_functions` neu deployen.
- Aufruf der `caller-api`-Funktion muss auf dem neuen Projekt `gzgfyuftjvezqjkosntu` verfügbar sein (dort liegt die eigentliche Caller-API-Logik).

Keine Datenbankänderungen.
